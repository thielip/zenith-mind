/**
 * 部落格文章詳頁（Cloudflare Worker）：僅 Supabase PostgREST。
 * 禁止 import @/infrastructure/db/prisma。
 */
import { fetchPostViewTotal } from "@/lib/analytics/post-view-totals";
import { supabaseRestWithFallback } from "@/lib/db/supabase-rest";
import type {
  BlogPostDetail,
  BlogPostFaq,
  BlogPostSeo,
  RecommendedPostCard,
} from "@/lib/blog/blog-post-types";

const POST_TAGS = ["posts", "blog"] as const;

const POST_DETAIL_SELECT = [
  "id",
  "slug",
  "title",
  "titleEn",
  "excerpt",
  "excerptEn",
  "content",
  "contentEn",
  "contentType",
  "contentBlocks",
  "faq",
  "coverImage",
  "coverImageAlt",
  "coverImageWidth",
  "coverImageHeight",
  "publishedAt",
  "createdAt",
  "updatedAt",
  "categoryId",
  "readingTime",
  "categories(id,name,nameEn,slug)",
  "post_tags(tags(name,slug))",
  "seo_metadata(metaTitle,metaTitleEn,metaDescription,metaDescriptionEn,ogTitle,ogDescription,ogImage,noIndex,noFollow)",
].join(",");

type PostDetailRow = {
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
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  readingTime: number | null;
  categories: {
    id: string;
    name: string;
    nameEn: string | null;
    slug: string;
  } | null;
  post_tags?: { tags: { name: string; slug: string } | null }[];
  seo_metadata: {
    metaTitle: string | null;
    metaTitleEn: string | null;
    metaDescription: string | null;
    metaDescriptionEn: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    noIndex: boolean | null;
    noFollow: boolean | null;
  } | null;
};

type RecommendedRow = {
  slug: string;
  title: string;
  titleEn: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: string | null;
};

type SitemapRow = {
  slug: string;
  updatedAt: string;
};

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapFaq(raw: unknown): BlogPostFaq[] | null {
  if (!Array.isArray(raw)) return null;
  return raw as BlogPostFaq[];
}

function mapSeo(row: PostDetailRow["seo_metadata"]): BlogPostSeo | null {
  if (!row) return null;
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

function mapPostDetailRow(row: PostDetailRow): BlogPostDetail {
  const tags: { tag: { name: string; slug: string } }[] = [];
  for (const pt of row.post_tags ?? []) {
    const t = pt.tags;
    if (t?.slug) tags.push({ tag: { name: t.name, slug: t.slug } });
  }

  const cat = row.categories;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.titleEn,
    excerpt: row.excerpt,
    excerptEn: row.excerptEn,
    content: row.content,
    contentEn: row.contentEn,
    contentType: row.contentType ?? "markdown",
    contentBlocks: row.contentBlocks,
    faq: mapFaq(row.faq),
    coverImage: row.coverImage,
    coverImageAlt: row.coverImageAlt,
    coverImageWidth: row.coverImageWidth,
    coverImageHeight: row.coverImageHeight,
    publishedAt: parseDate(row.publishedAt),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    categoryId: row.categoryId,
    readingTime: row.readingTime ?? 0,
    category: cat
      ? { id: cat.id, name: cat.name, nameEn: cat.nameEn, slug: cat.slug }
      : null,
    tags,
    seoMetadata: mapSeo(row.seo_metadata),
    _count: { pageViews: 0 },
  };
}

const postCache = { kind: "public" as const, revalidate: 3600, tags: [...POST_TAGS] };

export async function fetchBlogPostBySlugViaSupabase(
  slug: string
): Promise<BlogPostDetail | null> {
  const rows = await supabaseRestWithFallback<PostDetailRow[]>(
    "posts",
    {
      select: POST_DETAIL_SELECT,
      slug: `eq.${slug}`,
      status: "eq.PUBLISHED",
      deletedAt: "is.null",
      limit: "1",
    },
    [],
    undefined,
    postCache
  );
  const row = rows[0];
  if (!row) return null;

  const post = mapPostDetailRow(row);
  const pageViews = await fetchPostViewTotal(post.id);
  return { ...post, _count: { pageViews } };
}

export async function fetchRecommendedPostsViaSupabase(
  currentPostId: string,
  categoryId?: string
): Promise<RecommendedPostCard[]> {
  const params: Record<string, string> = {
    select: "slug,title,titleEn,coverImage,coverImageAlt,publishedAt",
    status: "eq.PUBLISHED",
    deletedAt: "is.null",
    id: `neq.${currentPostId}`,
    order: "publishedAt.desc",
    limit: "3",
  };
  if (categoryId) params.categoryId = `eq.${categoryId}`;

  const rows = await supabaseRestWithFallback<RecommendedRow[]>(
    "posts",
    params,
    [],
    undefined,
    postCache
  );

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    titleEn: row.titleEn,
    coverImage: row.coverImage,
    coverImageAlt: row.coverImageAlt,
    publishedAt: parseDate(row.publishedAt),
  }));
}

export async function fetchPublishedPostSlugsViaSupabase(
  limit: number
): Promise<string[]> {
  const rows = await supabaseRestWithFallback<{ slug: string }[]>(
    "posts",
    {
      select: "slug",
      status: "eq.PUBLISHED",
      deletedAt: "is.null",
      order: "publishedAt.desc",
      limit: String(limit),
    },
    [],
    undefined,
    postCache
  );
  return rows.map((r) => r.slug);
}

const SITEMAP_BATCH = 500;

export async function fetchSitemapPostsViaSupabase(
  maxPosts: number
): Promise<Array<{ slug: string; updatedAt: Date }>> {
  const out: Array<{ slug: string; updatedAt: Date }> = [];
  const cache = {
    kind: "public" as const,
    revalidate: 3600,
    tags: ["posts", "sitemap"],
  };

  for (let offset = 0; offset < maxPosts; offset += SITEMAP_BATCH) {
    const take = Math.min(SITEMAP_BATCH, maxPosts - offset);
    const rows = await supabaseRestWithFallback<SitemapRow[]>(
      "posts",
      {
        select: "slug,updatedAt",
        status: "eq.PUBLISHED",
        deletedAt: "is.null",
        order: "updatedAt.desc",
        limit: String(take),
        offset: String(offset),
      },
      [],
      undefined,
      cache
    );
    if (rows.length === 0) break;
    for (const row of rows) {
      const updatedAt = parseDate(row.updatedAt) ?? new Date();
      out.push({ slug: row.slug, updatedAt });
    }
    if (rows.length < take) break;
  }

  return out;
}
