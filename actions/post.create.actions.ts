// actions/post.create.actions.ts — Node Runtime
// 新增文章 Server Action（獨立檔案，避免 post.actions.ts 過長）

"use server";

import { z } from "zod";
import { cookies, headers } from "next/headers";
import { prisma } from "@/infrastructure/db/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { sanitizeText } from "@/lib/sanitize/html";
import { writeAuditLog } from "@/infrastructure/db/adapters/audit.prisma-adapter";
import { revalidateTag } from "next/cache";
import { purgePublicSiteAfterPostChange } from "@/lib/revalidate/purge-public-site";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

const createSchema = z.object({
  title:      z.string().min(2).max(200),
  slug:       z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  categoryId: z.string().cuid().optional().or(z.literal("")),
  excerpt:    z.string().max(300).optional(),
  excerptEn:  z.string().max(300).optional(),
  focusKeyword: z.string().max(100).optional(),
});

function normalizeSlug(slug: string): string {
  return sanitizeText(slug)
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createPostAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const h = await headers();
  const meta = {
    ip:        h.get("CF-Connecting-IP") ?? "unknown",
    userAgent: h.get("user-agent") ?? "",
    requestId: crypto.randomUUID(),
  };

  try {
    // Auth
    const jar   = await cookies();
    const token = jar.get("access_token")?.value;
    if (!token) return { success: false, data: null, error: Errors.auth() };
    const admin = await verifyAccessToken(token).catch(() => null);
    if (!admin)  return { success: false, data: null, error: Errors.auth() };

    // Zod
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const d = parsed.data;

    // 清洗
    const cleanTitle   = sanitizeText(d.title);
    const cleanExcerpt = d.excerpt ? sanitizeText(d.excerpt) : null;
    const cleanExcerptEn = d.excerptEn ? sanitizeText(d.excerptEn) : null;
    const cleanFocusKeyword = d.focusKeyword ? sanitizeText(d.focusKeyword) : cleanTitle.slice(0, 100);
    const cleanSlug    = normalizeSlug(d.slug);
    if (!cleanSlug) {
      return { success: false, data: null, error: Errors.validation("Invalid slug") };
    }

    // 檢查 slug 唯一性
    const existing = await prisma.post.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return { success: false, data: null, error: Errors.duplicate("slug") };
    }

    // 建立草稿
    const post = await prisma.post.create({
      data: {
        title:      cleanTitle,
        slug:       cleanSlug,
        excerpt:    cleanExcerpt,
        excerptEn:  cleanExcerptEn,
        status:     "DRAFT",
        content:    "",
        categoryId: d.categoryId || null,
        authorId:   admin.userId,
        seoMetadata: {
          create: {
            focusKeyword: cleanFocusKeyword || null,
            metaTitle: cleanTitle.slice(0, 70),
            metaDescription: cleanExcerpt,
            metaDescriptionEn: cleanExcerptEn,
          },
        },
      },
    });

    void writeAuditLog({
      action:     "CREATE",
      entityType: "Post",
      entityId:   post.id,
      userId:     admin.userId,
      metadata:   { slug: post.slug },
      ...meta,
    });

    revalidateTag("posts");
    void purgePublicSiteAfterPostChange(post.slug);

    return { success: true, data: { id: post.id }, error: null };

  } catch (e: unknown) {
    console.error(`[Post] createPost error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}
