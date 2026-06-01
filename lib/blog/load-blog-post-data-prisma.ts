import type { PrismaClient } from "@prisma/client";
import { fetchPostViewTotal } from "@/lib/analytics/post-view-totals";
import { mergePrismaPublishedWhere } from "@/lib/blog/public-post-visibility";
import {
  mapBlogPostDetailFromCore,
  mapSeoRow,
  mapAuthorFromUserRecord,
} from "@/lib/blog/map-blog-post-detail";
import type {
  BlogPostDetail,
  RecommendedPostCard,
} from "@/lib/blog/blog-post-types";

const postInclude = {
  author: { select: { id: true, email: true } },
  category: { select: { id: true, name: true, nameEn: true, slug: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
  seoMetadata: true,
} as const;

export async function loadBlogPostBySlugPrisma(
  prisma: PrismaClient,
  slug: string
): Promise<BlogPostDetail | null> {
  const post = await prisma.post.findFirst({
    where: mergePrismaPublishedWhere({ slug }),
    include: postInclude,
  });
  if (!post) return null;

  return mapBlogPostDetailFromCore({
    id: post.id,
    slug: post.slug,
    title: post.title,
    titleEn: post.titleEn,
    excerpt: post.excerpt,
    excerptEn: post.excerptEn,
    content: post.content,
    contentEn: post.contentEn,
    contentType: post.contentType,
    contentBlocks: post.contentBlocks,
    faq: post.faq,
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
    coverImageWidth: post.coverImageWidth,
    coverImageHeight: post.coverImageHeight,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    categoryId: post.categoryId,
    readingTime: post.readingTime,
    isPasswordProtected: post.isPasswordProtected,
    author: mapAuthorFromUserRecord(post.author),
    category: post.category,
    tags: post.tags,
    seoMetadata: post.seoMetadata ? mapSeoRow(post.seoMetadata) : null,
    pageViews: await fetchPostViewTotal(post.id),
  });
}

export async function loadRecommendedPostsPrisma(
  prisma: PrismaClient,
  currentPostId: string,
  categoryId?: string
): Promise<RecommendedPostCard[]> {
  return prisma.post.findMany({
    where: mergePrismaPublishedWhere({
      id: { not: currentPostId },
      ...(categoryId ? { categoryId } : {}),
    }),
    select: {
      slug: true,
      title: true,
      titleEn: true,
      coverImage: true,
      coverImageAlt: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
}

export async function loadPublishedPostSlugsPrisma(
  prisma: PrismaClient,
  limit: number
): Promise<string[]> {
  const rows = await prisma.post.findMany({
    where: mergePrismaPublishedWhere({}),
    select: { slug: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => r.slug);
}
