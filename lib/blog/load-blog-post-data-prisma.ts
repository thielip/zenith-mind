import type { PrismaClient } from "@prisma/client";
import type {
  BlogPostDetail,
  BlogPostFaq,
  RecommendedPostCard,
} from "@/lib/blog/blog-post-types";

const postInclude = {
  category: { select: { id: true, name: true, nameEn: true, slug: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
  seoMetadata: true,
  _count: { select: { pageViews: true } },
} as const;

function mapFaq(raw: unknown): BlogPostFaq[] | null {
  if (!Array.isArray(raw)) return null;
  return raw as BlogPostFaq[];
}

export async function loadBlogPostBySlugPrisma(
  prisma: PrismaClient,
  slug: string
): Promise<BlogPostDetail | null> {
  const post = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: postInclude,
  });
  if (!post) return null;

  return {
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
    faq: mapFaq(post.faq),
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
    coverImageWidth: post.coverImageWidth,
    coverImageHeight: post.coverImageHeight,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    categoryId: post.categoryId,
    readingTime: post.readingTime,
    category: post.category,
    tags: post.tags,
    seoMetadata: post.seoMetadata
      ? {
          metaTitle: post.seoMetadata.metaTitle,
          metaTitleEn: post.seoMetadata.metaTitleEn,
          metaDescription: post.seoMetadata.metaDescription,
          metaDescriptionEn: post.seoMetadata.metaDescriptionEn,
          ogTitle: post.seoMetadata.ogTitle,
          ogDescription: post.seoMetadata.ogDescription,
          ogImage: post.seoMetadata.ogImage,
          noIndex: post.seoMetadata.noIndex,
          noFollow: post.seoMetadata.noFollow,
        }
      : null,
    _count: post._count,
  };
}

export async function loadRecommendedPostsPrisma(
  prisma: PrismaClient,
  currentPostId: string,
  categoryId?: string
): Promise<RecommendedPostCard[]> {
  return prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      id: { not: currentPostId },
      ...(categoryId ? { categoryId } : {}),
    },
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
    where: { status: "PUBLISHED", deletedAt: null },
    select: { slug: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => r.slug);
}
