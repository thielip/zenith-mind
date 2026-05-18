import type { Prisma, PrismaClient } from "@prisma/client";
import { fetchPostViewTotalsMap } from "@/lib/analytics/post-view-totals";
import type {
  BlogListData,
  BlogListFilters,
} from "@/lib/blog/blog-list-types";

function buildWhere(filters: BlogListFilters): Prisma.PostWhereInput {
  const query = filters.query?.trim() ?? "";
  return {
    status: "PUBLISHED",
    deletedAt: null,
    ...(filters.category ? { category: { slug: filters.category } } : {}),
    ...(filters.tag ? { tags: { some: { tag: { slug: filters.tag } } } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { titleEn: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { excerptEn: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function loadBlogListDataWithPrisma(
  prisma: PrismaClient,
  filters: BlogListFilters,
  skip: number,
  perPage: number
): Promise<BlogListData> {
  const where = buildWhere(filters);

  const [posts, total, categories, tags] = await Promise.all([
    prisma.post.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        excerpt: true,
        excerptEn: true,
        coverImage: true,
        coverImageAlt: true,
        publishedAt: true,
        readingTime: true,
        category: { select: { name: true, nameEn: true, slug: true } },
        tags: {
          take: 3,
          include: { tag: { select: { name: true, nameEn: true, slug: true } } },
        },
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { slug: true, name: true, nameEn: true },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      where: { deletedAt: null },
      select: { slug: true, name: true, nameEn: true },
      orderBy: { posts: { _count: "desc" } },
      take: 18,
    }),
  ]);

  const viewTotals = await fetchPostViewTotalsMap(posts.map((p) => p.id));
  const postsWithViews = posts.map((post) => ({
    ...post,
    _count: { pageViews: viewTotals.get(post.id) ?? 0 },
  }));

  return { posts: postsWithViews, total, categories, tags };
}

export async function loadBlogListDataPrisma(
  filters: BlogListFilters,
  skip: number,
  perPage: number
): Promise<BlogListData> {
  const { prisma } = await import("@/infrastructure/db/prisma");
  return loadBlogListDataWithPrisma(prisma, filters, skip, perPage);
}
