import type {
  BlogPostAuthor,
  BlogPostDetail,
  BlogPostFaq,
  BlogPostSeo,
} from "@/lib/blog/blog-post-types";
import { mapBlogPostAuthor } from "@/lib/blog/map-blog-post-author";
import { toSafeDate } from "@/lib/blog/safe-blog-dates";

export type BlogPostDetailCore = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  content: string;
  contentEn: string | null;
  contentType: string;
  contentBlocks: unknown;
  faq: unknown;
  coverImage: string | null;
  coverImageAlt: string | null;
  coverImageWidth: number | null;
  coverImageHeight: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string | null;
  readingTime: number;
  isPasswordProtected: boolean;
  category: {
    id: string;
    name: string;
    nameEn: string | null;
    slug: string;
  } | null;
  author: BlogPostAuthor | null;
  tags: { tag: { name: string; slug: string } }[];
  seoMetadata: BlogPostSeo | null;
  pageViews: number;
};

export function mapFaq(raw: unknown): BlogPostFaq[] | null {
  if (!Array.isArray(raw)) return null;
  const out: BlogPostFaq[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const question = typeof o.question === "string" ? o.question : "";
    const answer = typeof o.answer === "string" ? o.answer : "";
    if (!question || !answer) continue;
    out.push({
      question,
      answer,
      ...(typeof o.questionEn === "string" ? { questionEn: o.questionEn } : {}),
      ...(typeof o.answerEn === "string" ? { answerEn: o.answerEn } : {}),
    });
  }
  return out.length > 0 ? out : null;
}

export function mapSeoRow(row: {
  metaTitle: string | null;
  metaTitleEn: string | null;
  metaDescription: string | null;
  metaDescriptionEn: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  noIndex: boolean | null;
  noFollow: boolean | null;
}): BlogPostSeo {
  return {
    metaTitle: row.metaTitle,
    metaTitleEn: row.metaTitleEn,
    metaDescription: row.metaDescription,
    metaDescriptionEn: row.metaDescriptionEn,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImage: row.ogImage,
    noIndex: Boolean(row.noIndex),
    noFollow: Boolean(row.noFollow),
  };
}

export function mapAuthorFromUserRecord(
  user: { id: string; email: string } | null | undefined
): BlogPostAuthor | null {
  if (!user?.id || !user.email) return null;
  return mapBlogPostAuthor(user.id, user.email);
}

export function mapBlogPostDetailFromCore(core: BlogPostDetailCore): BlogPostDetail {
  return {
    id: core.id,
    slug: core.slug,
    title: core.title,
    titleEn: core.titleEn,
    excerpt: core.excerpt,
    excerptEn: core.excerptEn,
    content: core.content,
    contentEn: core.contentEn,
    contentType: core.contentType,
    contentBlocks: core.contentBlocks,
    faq: mapFaq(core.faq),
    coverImage: core.coverImage,
    coverImageAlt: core.coverImageAlt,
    coverImageWidth: core.coverImageWidth,
    coverImageHeight: core.coverImageHeight,
    publishedAt: core.publishedAt,
    createdAt: toSafeDate(core.createdAt),
    updatedAt: toSafeDate(core.updatedAt),
    categoryId: core.categoryId,
    readingTime: core.readingTime,
    isPasswordProtected: core.isPasswordProtected,
    author: core.author,
    category: core.category,
    tags: core.tags,
    seoMetadata: core.seoMetadata,
    _count: { pageViews: core.pageViews },
  };
}
