// actions/post.actions.ts — Node Runtime
// 文章 CRUD Server Actions
// 執行順序：Zod → 清洗 → AuditLog（非同步）→ Business Logic

"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { purgePublicSiteAfterPostChange } from "@/lib/revalidate/purge-public-site";
import { prisma } from "@/infrastructure/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { gateAdminWrite } from "@/lib/auth/resolve-admin-action";
import { sanitizeRichText, sanitizeText } from "@/lib/sanitize/html";
import { optionalTrustedMediaUrl } from "@/lib/security/allowed-media-url";
import { isValidBlurHash, BLURHASH_FORMAT_ERROR } from "@/lib/validation/blurhash";
import { convertMarkdownImagesToHtml } from "@/lib/markdown/images";
import { writeAuditLog } from "@/infrastructure/db/adapters/audit.prisma-adapter";
import { buildFieldChanges } from "@/lib/audit/field-changes";
import { upsertPostDeleteRedirects } from "@/lib/redirects/queries";
import { getRequestMeta } from "@/lib/request/request-meta";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

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
  titleEn:     z.string().min(2).max(200),
  excerpt:     z.string().max(300).optional(),
  excerptEn:   z.string().max(300).optional(),
  focusKeyword: z.string().max(100).optional(),
  focusKeywordEn: z.string().max(100).optional(),
  content:     z.string(),
  contentEn:   z.string().optional(),
  categoryId:  z.string().cuid().optional().or(z.literal("")),
  coverImage:  optionalTrustedMediaUrl,
  coverImageAlt: z.string().max(300).optional().or(z.literal("")),
  coverImageWidth: z.number().int().positive().optional(),
  coverImageHeight: z.number().int().positive().optional(),
  coverImageBlurHash: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(""))
    .refine((v) => isValidBlurHash(v ?? ""), { message: BLURHASH_FORMAT_ERROR }),
  contentDoc: postContentDocSchema,
  scheduledAt: z.string().optional(),
  faq: z.array(z.object({
    question: z.string().min(1).max(500),
    answer: z.string().min(1).max(5000),
    questionEn: z.string().max(500).optional(),
    answerEn: z.string().max(5000).optional(),
  })).optional(),
  status:      z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
  isPasswordProtected: z.boolean().optional().default(false),
  accessPassword: z.string().min(4).max(128).optional().or(z.literal("")),
  clearAccessPassword: z.boolean().optional(),
});

const seoText = (max: number) => z.string().trim().max(max).optional();

const updateSeoSchema = z.object({
  postId:            z.string().cuid(),
  metaTitle:         seoText(70),
  metaDescription:   seoText(160),
  metaTitleEn:       seoText(70),
  metaDescriptionEn: seoText(160),
  focusKeyword:      seoText(100),
  focusKeywordEn:    seoText(100),
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
    const gate = await gateAdminWrite("post");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

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

    const scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;
    if (d.status === "SCHEDULED") {
      if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
        return {
          success: false,
          data: null,
          error: Errors.validation("排程發布需設定未來的發布時間"),
        };
      }
      if (scheduledAt.getTime() <= Date.now()) {
        return {
          success: false,
          data: null,
          error: Errors.validation("排程時間必須晚於現在"),
        };
      }
    }

    const existing = await prisma.post.findUnique({
      where: { id: d.id, deletedAt: null },
      select: {
        accessPasswordHash: true,
        title: true,
        titleEn: true,
        status: true,
        slug: true,
        excerpt: true,
        categoryId: true,
      },
    });
    if (!existing) {
      return { success: false, data: null, error: Errors.notFound("Post") };
    }

    let accessPasswordHash: string | null | undefined = undefined;
    if (d.clearAccessPassword || !d.isPasswordProtected) {
      accessPasswordHash = null;
    } else if (d.accessPassword && d.accessPassword.length > 0) {
      accessPasswordHash = await hashPassword(d.accessPassword);
    } else if (d.isPasswordProtected && !existing.accessPasswordHash) {
      return {
        success: false,
        data: null,
        error: Errors.validation("啟用文章密碼保護時請設定密碼"),
      };
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

    const publishedAt =
      d.status === "PUBLISHED"
        ? new Date()
        : d.status === "SCHEDULED"
          ? undefined
          : undefined;

    const afterSnapshot = {
      title: cleanTitle,
      titleEn: cleanTitleEn,
      status: d.status,
      slug: existing.slug,
      excerpt: cleanExcerpt,
      categoryId: d.categoryId || null,
    };
    const changes = buildFieldChanges(
      {
        title: existing.title,
        titleEn: existing.titleEn,
        status: existing.status,
        slug: existing.slug,
        excerpt: existing.excerpt,
        categoryId: existing.categoryId,
      },
      afterSnapshot,
      ["title", "titleEn", "status", "excerpt", "categoryId"]
    );

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
        scheduledAt: d.status === "SCHEDULED" ? scheduledAt : null,
        publishedAt,
        isPasswordProtected: d.isPasswordProtected,
        ...(accessPasswordHash !== undefined
          ? { accessPasswordHash }
          : {}),
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
      metadata:   JSON.parse(
        JSON.stringify({
          status: d.status,
          slug: post.slug,
          ...(changes
            ? {
                changes,
                before: {
                  title: existing.title,
                  titleEn: existing.titleEn,
                  status: existing.status,
                  excerpt: existing.excerpt,
                  categoryId: existing.categoryId,
                },
                after: afterSnapshot,
              }
            : {}),
        })
      ),
      ...meta,
    });

    // ISR 重新驗證
    revalidateTag("posts");
    revalidatePath(`/zh-TW/blog/${post.slug}`);
    revalidatePath(`/en/blog/${post.slug}`);
    revalidatePath("/zh-TW/blog");
    revalidatePath("/en/blog");
    void purgePublicSiteAfterPostChange(post.slug);

    const cleanFocusKw = d.focusKeyword?.trim()
      ? sanitizeText(d.focusKeyword)
      : null;
    const cleanFocusKwEn = d.focusKeywordEn?.trim()
      ? sanitizeText(d.focusKeywordEn)
      : null;
    await prisma.seoMetadata.upsert({
      where: { postId: post.id },
      create: {
        postId: post.id,
        focusKeyword: cleanFocusKw,
        focusKeywordEn: cleanFocusKwEn,
        metaTitle: cleanTitle.slice(0, 70),
        metaTitleEn: cleanTitleEn?.slice(0, 70) ?? null,
        metaDescription: cleanExcerpt,
        metaDescriptionEn: cleanExcerptEn,
      },
      update: {
        focusKeyword: cleanFocusKw,
        focusKeywordEn: cleanFocusKwEn,
      },
    });

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
    const gate = await gateAdminWrite("post");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

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
      focusKeywordEn:    d.focusKeywordEn     ? sanitizeText(d.focusKeywordEn)     : null,
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
    const gate = await gateAdminWrite("post");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

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
    void purgePublicSiteAfterPostChange(post.slug);

    return { success: true, data: undefined, error: null };

  } catch (e: unknown) {
    console.error(`[Post] deletePost error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}
