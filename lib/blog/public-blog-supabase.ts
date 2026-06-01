/**
 * 部落格列表（Cloudflare Worker）：僅 Supabase PostgREST。
 * 禁止 import @/infrastructure/db/prisma。
 */
import { fetchPostViewTotalsMap } from "@/lib/analytics/post-view-totals";
import { supabasePublishedVisibilityAnd } from "@/lib/blog/public-post-visibility";
import { PUBLIC_READ_CACHE_TAGS } from "@/lib/public-content/cache-tags";
import { supabaseCount, supabaseRestWithFallback } from "@/lib/db/supabase-rest";

const PUBLIC_KEY = "public" as const;
import { safeQuery } from "@/lib/db/safe-query";
import type {
  BlogListCategory,
  BlogListFilters,
  BlogListPost,
  BlogListTag,
} from "@/lib/blog/blog-list-types";

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: string | null;
  readingTime: number | null;
  categories: { name: string; nameEn: string | null; slug: string } | null;
};

type PostTagRow = {
  postId: string;
  tags: { name: string; nameEn: string | null; slug: string } | null;
};

/** 與首頁 featured 相同欄位 + 封面（PostgREST 欄位名與 Prisma 一致） */
const POST_LIST_SELECT =
  "id,slug,title,titleEn,excerpt,excerptEn,publishedAt,readingTime,coverImage,coverImageAlt,categories(name,nameEn,slug)";

function parsePublishedAt(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function escapeIlikeTerm(raw: string): string {
  return raw.replace(/[%_*(),.\\]/g, "").trim();
}

const POSTS_LIST_CACHE = {
  kind: "public" as const,
  revalidate: 3600,
  tags: [...PUBLIC_READ_CACHE_TAGS.posts],
};

function buildListParams(filters: BlogListFilters): Record<string, string> {
  const params: Record<string, string> = {
    and: supabasePublishedVisibilityAnd(),
    select: POST_LIST_SELECT,
    order: "publishedAt.desc,createdAt.desc",
  };

  if (filters.category) {
    params["categories.slug"] = `eq.${filters.category}`;
  }

  if (filters.tag) {
    params["post_tags.tags.slug"] = `eq.${filters.tag}`;
    params.select = `${POST_LIST_SELECT},post_tags!inner(tags!inner(slug))`;
  }

  const q = filters.query ? escapeIlikeTerm(filters.query) : "";
  if (q) {
    params.or = `(title.ilike.*${q}*,titleEn.ilike.*${q}*,excerpt.ilike.*${q}*,excerptEn.ilike.*${q}*)`;
  }

  return params;
}

function mapPostRow(
  row: BlogPostRow,
  tagsByPostId: Map<string, { tag: BlogListTag }[]>,
  viewTotals: Map<string, number>
): BlogListPost {
  const cat = row.categories;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.titleEn,
    excerpt: row.excerpt,
    excerptEn: row.excerptEn,
    coverImage: row.coverImage,
    coverImageAlt: row.coverImageAlt,
    publishedAt: parsePublishedAt(row.publishedAt),
    readingTime: row.readingTime ?? 0,
    category: cat ? { name: cat.name, nameEn: cat.nameEn, slug: cat.slug } : null,
    tags: tagsByPostId.get(row.id) ?? [],
    _count: { pageViews: viewTotals.get(row.id) ?? 0 },
  };
}

function mapPostRows(
  rows: BlogPostRow[],
  tagsByPostId: Map<string, { tag: BlogListTag }[]>,
  viewTotals: Map<string, number>
): BlogListPost[] {
  return rows.map((row) => mapPostRow(row, tagsByPostId, viewTotals));
}

async function fetchTagsForPosts(
  postIds: string[]
): Promise<Map<string, { tag: BlogListTag }[]>> {
  const byPost = new Map<string, { tag: BlogListTag }[]>();
  if (postIds.length === 0) return byPost;

  const inList = postIds.map((id) => `"${id}"`).join(",");
  const rows = await supabaseRestWithFallback<PostTagRow[]>(
    "post_tags",
    {
      select: "postId,tags(slug,name,nameEn)",
      postId: `in.(${inList})`,
    },
    [],
    undefined,
    POSTS_LIST_CACHE,
    PUBLIC_KEY
  );

  for (const row of rows) {
    const t = row.tags;
    if (!t?.slug) continue;
    const list = byPost.get(row.postId) ?? [];
    if (list.length >= 3) continue;
    list.push({ tag: { slug: t.slug, name: t.name, nameEn: t.nameEn } });
    byPost.set(row.postId, list);
  }
  return byPost;
}

export async function fetchBlogListPostsViaSupabase(
  filters: BlogListFilters,
  skip: number,
  take: number
): Promise<BlogListPost[]> {
  const params = buildListParams(filters);
  params.limit = String(take);
  params.offset = String(skip);

  const rows = await supabaseRestWithFallback<BlogPostRow[]>(
    "posts",
    params,
    [],
    undefined,
    POSTS_LIST_CACHE,
    PUBLIC_KEY
  );
  const tagsByPostId = await safeQuery(
    "blog.postTags",
    () => fetchTagsForPosts(rows.map((r) => r.id)),
    new Map<string, { tag: BlogListTag }[]>()
  );
  const viewTotals = await safeQuery(
    "blog.viewTotals",
    () => fetchPostViewTotalsMap(rows.map((r) => r.id)),
    new Map<string, number>()
  );
  return mapPostRows(rows, tagsByPostId, viewTotals);
}

export async function countBlogListPostsViaSupabase(
  filters: BlogListFilters
): Promise<number> {
  const params = buildListParams(filters);
  delete params.select;
  delete params.order;
  delete params.limit;
  delete params.offset;
  return supabaseCount("posts", params, POSTS_LIST_CACHE, PUBLIC_KEY);
}

export async function fetchBlogCategoriesViaSupabase(): Promise<BlogListCategory[]> {
  return supabaseRestWithFallback<BlogListCategory[]>(
    "categories",
    {
      select: "slug,name,nameEn",
      deletedAt: "is.null",
      order: "name.asc",
      limit: "50",
    },
    [],
    undefined,
    POSTS_LIST_CACHE,
    PUBLIC_KEY
  );
}

export async function fetchBlogTagsViaSupabase(): Promise<BlogListTag[]> {
  return supabaseRestWithFallback<BlogListTag[]>(
    "tags",
    {
      select: "slug,name,nameEn",
      deletedAt: "is.null",
      order: "name.asc",
      limit: "18",
    },
    [],
    undefined,
    POSTS_LIST_CACHE,
    PUBLIC_KEY
  );
}

export async function loadBlogListDataViaSupabase(
  filters: BlogListFilters,
  skip: number,
  perPage: number
): Promise<{
  posts: BlogListPost[];
  total: number;
  categories: BlogListCategory[];
  tags: BlogListTag[];
}> {
  const [posts, total, categories, tags] = await Promise.all([
    fetchBlogListPostsViaSupabase(filters, skip, perPage),
    safeQuery("blog.count", () => countBlogListPostsViaSupabase(filters), 0),
    safeQuery("blog.categories", () => fetchBlogCategoriesViaSupabase(), []),
    safeQuery("blog.tags", () => fetchBlogTagsViaSupabase(), []),
  ]);

  return { posts, total, categories, tags };
}
