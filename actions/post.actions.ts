// actions/post.actions.ts — Node Runtime
// 文章 CRUD Server Actions
// 執行順序：Zod → 清洗 → AuditLog（非同步）→ Business Logic

"use server";

import { z } from "zod";
import { cookies, headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/infrastructure/db/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { sanitizeRichText, sanitizeText } from "@/lib/sanitize/html";
import { convertMarkdownImagesToHtml } from "@/lib/markdown/images";
import { writeAuditLog } from "@/infrastructure/db/adapters/audit.prisma-adapter";
import { upsertPostDeleteRedirects } from "@/lib/redirects/queries";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

// ── Auth 驗證工具 ─────────────────────────────────────────

async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const jar   = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) throw new Error("UNAUTHORIZED");
  return verifyAccessToken(token);
}

async function getRequestMeta() {
  const h = await headers();
  return {
    ip:        h.get("CF-Connecting-IP") ?? "unknown",
    userAgent: h.get("user-agent") ?? "",
    requestId: crypto.randomUUID(),
  };
}

// ── Zod Schema ────────────────────────────────────────────

const postContentDocSchema = z
  .object({
    "zh-TW": z.unknown().optional(),
    en: z.unknown().optional(),
  })
  .optional();

const updatePostSchema = z.object({
  id:          z.string().cuid(),
  title:       z.string().min(2).max(200),
  titleEn:     z.string().max(200).optional(),
  excerpt:     z.string().max(300).optional(),
  excerptEn:   z.string().max(300).optional(),
  content:     z.string(),
  contentEn:   z.string().optional(),
  categoryId:  z.string().cuid().optional().or(z.literal("")),
  coverImage:  z.string().url().optional().or(z.literal("")),
  coverImageAlt: z.string().max(300).optional().or(z.literal("")),
  coverImageWidth: z.number().int().positive().optional(),
  coverImageHeight: z.number().int().positive().optional(),
  coverImageBlurHash: z.string().max(200).optional().or(z.literal("")),
  contentDoc: postContentDocSchema,
  scheduledAt: z.string().optional(),
  faq: z.array(z.object({
    question: z.string().min(1).max(500),
    answer: z.string().min(1).max(5000),
    questionEn: z.string().max(500).optional(),
    answerEn: z.string().max(5000).optional(),
  })).optional(),
  status:      z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
});

const seoText = (max: number) => z.string().trim().max(max).optional();

const updateSeoSchema = z.object({
  postId:            z.string().cuid(),
  metaTitle:         seoText(70),
  metaDescription:   seoText(160),
  metaTitleEn:       seoText(70),
  metaDescriptionEn: seoText(160),
  focusKeyword:      seoText(100),
  ogTitle:           seoText(70),
  ogDescription:     seoText(200),
  noIndex:           z.boolean().default(false),
});

// ═══════════════════════════════════════════════════════
// Action 1：更新文章
// ═══════════════════════════════════════════════════════

export async function updatePostAction(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const meta = await getRequestMeta();

  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return { success: false, data: null, error: Errors.auth() };

    // Step 3：Zod Validation
    const parsed = updatePostSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const d = parsed.data;

    const visibleContent = d.content.replace(/<[^>]+>/g, "").trim();
    if (d.status === "PUBLISHED" && visibleContent.length === 0) {
      return { success: false, data: null, error: Errors.validation("Published posts require content") };
    }

    // Step 4：資料清洗
    // 純文字欄位：sanitizeText
    // 富文本欄位：sanitizeRichText
    const cleanTitle    = sanitizeText(d.title);
    const cleanTitleEn  = d.titleEn  ? sanitizeText(d.titleEn)  : null;
    const cleanExcerpt  = d.excerpt  ? sanitizeText(d.excerpt)  : null;
    const cleanExcerptEn= d.excerptEn ? sanitizeText(d.excerptEn) : null;
    const cleanContent  = sanitizeRichText(convertMarkdownImagesToHtml(d.content));
    const cleanContentEn= d.contentEn ? sanitizeRichText(convertMarkdownImagesToHtml(d.contentEn)) : null;
    const cleanFaq = (d.faq ?? [])
      .map((item) => ({
        question: sanitizeText(item.question),
        answer: sanitizeText(item.answer),
        questionEn: item.questionEn ? sanitizeText(item.questionEn) : undefined,
        answerEn: item.answerEn ? sanitizeText(item.answerEn) : undefined,
      }))
      .filter((item) => item.question.length > 0 && item.answer.length > 0);

    const cleanCoverAlt = d.coverImageAlt?.trim()
      ? sanitizeText(d.coverImageAlt)
      : null;
    const cleanBlur = d.coverImageBlurHash?.trim()
      ? sanitizeText(d.coverImageBlurHash)
      : null;

    const contentDocForDb =
      d.contentDoc && Object.keys(d.contentDoc).length > 0
        ? (JSON.parse(JSON.stringify(d.contentDoc)) as object)
        : undefined;

    // 計算閱讀時間（250 字/分鐘）
    const wordCount   = cleanContent.replace(/<[^>]+>/g, "").length;
    const readingTime = Math.max(1, Math.round(wordCount / 250));

    // 排程時間處理
    const scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;
    const publishedAt = d.status === "PUBLISHED" ? new Date() : undefined;

    // Step 6：Business Logic
    const post = await prisma.post.update({
      where: { id: d.id, deletedAt: null },
      data:  {
        title:       cleanTitle,
        titleEn:     cleanTitleEn,
        excerpt:     cleanExcerpt,
        excerptEn:   cleanExcerptEn,
        content:     cleanContent,
        contentEn:   cleanContentEn,
        contentType: "tiptap",
        status:      d.status,
        categoryId:  d.categoryId || null,
        coverImage:  d.coverImage || null,
        coverImageAlt: cleanCoverAlt,
        coverImageWidth: d.coverImageWidth ?? null,
        coverImageHeight: d.coverImageHeight ?? null,
        coverImageBlurHash: cleanBlur,
        contentDoc: contentDocForDb,
        scheduledAt,
        publishedAt,
        faq: cleanFaq,
        faqUpdatedAt: cleanFaq.length > 0 ? new Date() : null,
        readingTime,
        updatedAt:   new Date(),
      },
    });

    // Step 5：Audit Log（非同步，不 await）
    void writeAuditLog({
      action:     "UPDATE",
      entityType: "Post",
      entityId:   post.id,
      userId:     admin.userId,
      metadata:   { status: d.status },
      ...meta,
    });

    // ISR 重新驗證
    revalidateTag("posts");
    revalidatePath(`/zh-TW/blog/${post.slug}`);
    revalidatePath(`/en/blog/${post.slug}`);
    revalidatePath("/zh-TW/blog");
    revalidatePath("/en/blog");

    return { success: true, data: { id: post.id }, error: null };

  } catch (e: unknown) {
    console.error(`[Post] updatePost error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

// ═══════════════════════════════════════════════════════
// Action 2：更新 SEO 設定
// ═══════════════════════════════════════════════════════

export async function updateSeoAction(
  input: unknown
): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();

  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return { success: false, data: null, error: Errors.auth() };

    const parsed = updateSeoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const d = parsed.data;

    // 清洗純文字欄位
    const clean = {
      metaTitle:         d.metaTitle         ? sanitizeText(d.metaTitle)         : null,
      metaDescription:   d.metaDescription   ? sanitizeText(d.metaDescription)   : null,
      metaTitleEn:       d.metaTitleEn       ? sanitizeText(d.metaTitleEn)       : null,
      metaDescriptionEn: d.metaDescriptionEn ? sanitizeText(d.metaDescriptionEn) : null,
      focusKeyword:      d.focusKeyword       ? sanitizeText(d.focusKeyword)       : null,
      ogTitle:           d.ogTitle           ? sanitizeText(d.ogTitle)           : null,
      ogDescription:     d.ogDescription     ? sanitizeText(d.ogDescription)     : null,
      noIndex:           d.noIndex,
    };

    await prisma.seoMetadata.upsert({
      where:  { postId: d.postId },
      create: { postId: d.postId, ...clean },
      update: clean,
    });

    void writeAuditLog({
      action:     "UPDATE",
      entityType: "SeoMetadata",
      entityId:   d.postId,
      userId:     admin.userId,
      ...meta,
    });

    return { success: true, data: undefined, error: null };

  } catch (e: unknown) {
    console.error(`[Post] updateSeo error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

// ═══════════════════════════════════════════════════════
// Action 3：Soft Delete 文章
// ═══════════════════════════════════════════════════════

export async function deletePostAction(
  postId: unknown
): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();

  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return { success: false, data: null, error: Errors.auth() };

    const parsed = z.string().cuid().safeParse(postId);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation() };
    }

    const post = await prisma.post.findUnique({
      where:  { id: parsed.data, deletedAt: null },
      select: {
        id: true,
        slug: true,
        category: { select: { slug: true } },
      },
    });
    if (!post) return { success: false, data: null, error: Errors.notFound("Post") };

    // Soft Delete
    await prisma.post.update({
      where: { id: parsed.data },
      data:  { deletedAt: new Date(), status: "ARCHIVED" },
    });

    // 建立 zh-TW / en 雙語 301（優先導向同分類列表）
    await upsertPostDeleteRedirects(post.slug, post.category?.slug ?? null);

    void writeAuditLog({
      action:     "DELETE",
      entityType: "Post",
      entityId:   parsed.data,
      userId:     admin.userId,
      ...meta,
    });

    revalidateTag("posts");
    revalidatePath("/zh-TW/blog");
    revalidatePath("/en/blog");
    revalidatePath(`/zh-TW/blog/${post.slug}`);
    revalidatePath(`/en/blog/${post.slug}`);
    revalidatePath("/admin/posts");

    return { success: true, data: undefined, error: null };

  } catch (e: unknown) {
    console.error(`[Post] deletePost error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}
