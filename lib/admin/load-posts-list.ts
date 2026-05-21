import type { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import {
  ADMIN_TOPIC_SLUG_ORDER,
  type AdminPostsListParams,
  topicDisplayName,
} from "@/lib/admin/posts-list-params";

export interface AdminPostListRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  categoryName: string | null;
  categorySlug: string | null;
}

export interface AdminTopicStat {
  slug: string;
  name: string;
  count: number;
}

function buildPostWhere(params: AdminPostsListParams): Prisma.PostWhereInput {
  const where: Prisma.PostWhereInput = { deletedAt: null };

  if (params.status !== "all") {
    where.status = params.status;
  }

  if (params.categorySlug) {
    where.category = { slug: params.categorySlug, deletedAt: null };
  }

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { slug: { contains: params.q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function loadAdminPostsList(params: AdminPostsListParams) {
  const where = buildPostWhere(params);
  const skip = (params.page - 1) * params.perPage;

  const [posts, total, categories, countGroups] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: params.perPage,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({
      where: {
        deletedAt: null,
        slug: { in: [...ADMIN_TOPIC_SLUG_ORDER] },
      },
      select: { id: true, slug: true, name: true },
    }),
    prisma.post.groupBy({
      by: ["categoryId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const countBySlug = new Map<string, number>();

  for (const row of countGroups) {
    if (!row.categoryId) continue;
    const cat = categoryById.get(row.categoryId);
    if (cat) countBySlug.set(cat.slug, row._count._all);
  }

  const topicStats: AdminTopicStat[] = ADMIN_TOPIC_SLUG_ORDER.map((slug) => {
    const cat = categories.find((c) => c.slug === slug);
    return {
      slug,
      name: topicDisplayName(slug, cat?.name),
      count: countBySlug.get(slug) ?? 0,
    };
  });

  const rows: AdminPostListRow[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    categoryName: post.category?.name ?? null,
    categorySlug: post.category?.slug ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil(total / params.perPage));

  return {
    posts: rows,
    total,
    totalPages,
    topicStats,
  };
}
