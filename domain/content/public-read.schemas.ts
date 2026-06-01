import { z } from "zod";

export const LocalizedStringDtoSchema = z.object({
  current: z.string(),
  translations: z.object({
    "zh-TW": z.string(),
    en: z.string(),
  }),
});

export const PublicPostListItemDtoSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: LocalizedStringDtoSchema,
  excerpt: LocalizedStringDtoSchema,
  publishedAt: z.string().datetime().nullable(),
  readingTime: z.number().int().nonnegative(),
  category: z
    .object({
      slug: z.string(),
      name: LocalizedStringDtoSchema,
    })
    .nullable(),
});

const BlogTagSchema = z.object({
  tag: z.object({
    slug: z.string(),
    name: z.string(),
    nameEn: z.string().nullable().optional(),
  }),
});

export const BlogListPostSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  titleEn: z.string().nullable(),
  excerpt: z.string().nullable(),
  excerptEn: z.string().nullable(),
  coverImage: z.string().nullable(),
  coverImageAlt: z.string().nullable(),
  publishedAt: z.date().nullable(),
  readingTime: z.number(),
  category: z
    .object({
      name: z.string(),
      nameEn: z.string().nullable(),
      slug: z.string(),
    })
    .nullable(),
  tags: z.array(BlogTagSchema),
  _count: z.object({ pageViews: z.number() }),
});

export const BlogPostAuthorSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
});

export const BlogPostSeoSchema = z.object({
  metaTitle: z.string().nullable(),
  metaTitleEn: z.string().nullable(),
  metaDescription: z.string().nullable(),
  metaDescriptionEn: z.string().nullable(),
  ogTitle: z.string().nullable(),
  ogDescription: z.string().nullable(),
  ogImage: z.string().nullable(),
  noIndex: z.boolean(),
  noFollow: z.boolean(),
});

export const BlogPostDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  titleEn: z.string().nullable(),
  excerpt: z.string().nullable(),
  excerptEn: z.string().nullable(),
  content: z.string(),
  contentEn: z.string().nullable(),
  contentType: z.string(),
  contentBlocks: z.unknown(),
  faq: z.array(z.unknown()).nullable(),
  coverImage: z.string().nullable(),
  coverImageAlt: z.string().nullable(),
  coverImageWidth: z.number().nullable(),
  coverImageHeight: z.number().nullable(),
  publishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  categoryId: z.string().nullable(),
  readingTime: z.number(),
  isPasswordProtected: z.boolean(),
  author: BlogPostAuthorSchema.nullable(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      nameEn: z.string().nullable(),
      slug: z.string(),
    })
    .nullable(),
  tags: z.array(
    z.object({
      tag: z.object({ name: z.string(), slug: z.string() }),
    })
  ),
  seoMetadata: BlogPostSeoSchema.nullable(),
  _count: z.object({ pageViews: z.number() }),
});

export const BlogPostLoadResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("found"),
    post: BlogPostDetailSchema,
  }),
  z.object({ status: z.literal("missing") }),
  z.object({ status: z.literal("unavailable") }),
]);

export const SitemapPostEntrySchema = z.object({
  slug: z.string().min(1),
  updatedAt: z.date(),
});
