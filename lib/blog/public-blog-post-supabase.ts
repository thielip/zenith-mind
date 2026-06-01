/**
 * 部落格文章詳頁（Cloudflare Worker）：僅 Supabase PostgREST。
 * 禁止 import @/infrastructure/db/prisma。
 */
import { fetchPostViewTotal } from "@/lib/analytics/post-view-totals";
import { supabasePublishedVisibilityAnd } from "@/lib/blog/public-post-visibility";
import { logBlogRenderError } from "@/lib/blog/log-blog-render-error";
import {
  mapBlogPostDetailFromCore,
  mapSeoRow,
  mapAuthorFromUserRecord,
} from "@/lib/blog/map-blog-post-detail";
import { toSafeDate } from "@/lib/blog/safe-blog-dates";
import {
  supabaseRest,
  supabaseRestWithFallback,
} from "@/lib/db/supabase-rest";
import type { BlogPostDetail, RecommendedPostCard } from "@/lib/blog/blog-post-types";

const PUBLIC_KEY = "public" as const;

const POST_TAGS = ["posts", "blog"] as const;

/** 勿內嵌 post_tags / seo_metadata（單表 403 會讓整筆 posts 查詢失敗） */
const POST_DETAIL_CORE_SELECT = [
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
  "authorId",
  "readingTime",
  "isPasswordProtected",
  "categories(id,name,nameEn,slug)",
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
  authorId: string | null;
  readingTime: number | null;
  isPasswordProtected: boolean | null;
  categories:
    | {
        id: string;
        name: string;
        nameEn: string | null;
        slug: string;
      }
    | {
        id: string;
        name: string;
        nameEn: string | null;
        slug: string;
      }[]
    | null;
};

type PostTagJoinRow = {
  tags: { name: string; slug: string } | null;
};

type SeoMetadataRow = {
  metaTitle: string | null;
  metaTitleEn: string | null;
  metaDescription: string | null;
  metaDescriptionEn: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  noIndex: boolean | null;
  noFollow: boolean | null;
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

function mapPostTags(rows: PostTagJoinRow[]): { tag: { name: string; slug: string } }[] {
  const tags: { tag: { name: string; slug: string } }[] = [];
  for (const pt of rows) {
    const t = pt.tags;
    if (t?.slug) tags.push({ tag: { name: t.name, slug: t.slug } });
  }
  return tags;
}

type CategoryEmbed = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
};

function pickCategoryEmbed(
  categories: PostDetailRow["categories"]
): CategoryEmbed | null {
  if (!categories) return null;
  const cat = Array.isArray(categories) ? categories[0] : categories;
  return cat ?? null;
}

const postCache = { kind: "public" as const, revalidate: 3600, tags: [...POST_TAGS] };

async function fetchAuthorById(authorId: string | null) {
  if (!authorId) return null;
  try {
    const rows = await supabaseRest<{ id: string; email: string }[]>(
      "users",
      {
        select: "id,email",
        id: `eq.${authorId}`,
        limit: "1",
      },
      undefined,
      postCache,
      PUBLIC_KEY
    );
    return mapAuthorFromUserRecord(rows[0]);
  } catch {
    return null;
  }
}

async function fetchPostTagsForPost(
  postId: string
): Promise<{ tag: { name: string; slug: string } }[]> {
  const rows = await supabaseRestWithFallback<PostTagJoinRow[]>(
    "post_tags",
    {
      select: "tags(name,slug)",
      postId: `eq.${postId}`,
    },
    [],
    undefined,
    postCache,
    PUBLIC_KEY
  );
  return mapPostTags(rows);
}

async function fetchSeoForPost(postId: string): Promise<SeoMetadataRow | null> {
  const rows = await supabaseRestWithFallback<SeoMetadataRow[]>(
    "seo_metadata",
    {
      select:
        "metaTitle,metaTitleEn,metaDescription,metaDescriptionEn,ogTitle,ogDescription,ogImage,noIndex,noFollow",
      postId: `eq.${postId}`,
      limit: "1",
    },
    [],
    undefined,
    postCache,
    PUBLIC_KEY
  );
  return rows[0] ?? null;
}

/** 輕量探測：區分「真的沒有文章」與「載入失敗」 */
export async function probePublishedPostSlugExists(slug: string): Promise<boolean> {
  try {
    const rows = await supabaseRest<{ slug: string }[]>(
      "posts",
      {
        select: "slug",
        slug: `eq.${slug}`,
        and: supabasePublishedVisibilityAnd(),
        limit: "1",
      },
      undefined,
      { kind: "fresh" },
      PUBLIC_KEY
    );
    return rows.length > 0;
  } catch (error) {
    logBlogRenderError("probePublishedPostSlugExists", error, { slug });
    return false;
  }
}

export async function fetchBlogPostBySlugViaSupabase(
  slug: string
): Promise<BlogPostDetail | null> {
  try {
    return await fetchBlogPostBySlugViaSupabaseInner(slug);
  } catch (error) {
    logBlogRenderError("fetchBlogPostBySlugViaSupabase", error, { slug });
    return null;
  }
}

async function fetchBlogPostBySlugViaSupabaseInner(
  slug: string
): Promise<BlogPostDetail | null> {
  const rows = await supabaseRest<PostDetailRow[]>(
    "posts",
    {
      select: POST_DETAIL_CORE_SELECT,
      slug: `eq.${slug}`,
      and: supabasePublishedVisibilityAnd(),
      limit: "1",
    },
    undefined,
    postCache,
    PUBLIC_KEY
  );
  const row = rows[0];
  if (!row) return null;

  const viewPromise = fetchPostViewTotal(row.id).catch((error) => {
    console.error("[blog.post] view total failed", error);
    return 0;
  });

  const [tags, seoRow, pageViews, author] = await Promise.all([
    fetchPostTagsForPost(row.id),
    fetchSeoForPost(row.id),
    viewPromise,
    fetchAuthorById(row.authorId),
  ]);

  const cat = pickCategoryEmbed(row.categories);
  return mapBlogPostDetailFromCore({
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.titleEn,
    excerpt: row.excerpt,
    excerptEn: row.excerptEn,
    content: typeof row.content === "string" ? row.content : "",
    contentEn: row.contentEn,
    contentType: row.contentType ?? "markdown",
    contentBlocks: row.contentBlocks,
    faq: row.faq,
    coverImage: row.coverImage,
    coverImageAlt: row.coverImageAlt,
    coverImageWidth: row.coverImageWidth,
    coverImageHeight: row.coverImageHeight,
    publishedAt: parseDate(row.publishedAt),
    createdAt: toSafeDate(row.createdAt),
    updatedAt: toSafeDate(row.updatedAt),
    categoryId: row.categoryId,
    readingTime: row.readingTime ?? 0,
    isPasswordProtected: Boolean(row.isPasswordProtected),
    author,
    category: cat,
    tags,
    seoMetadata: seoRow ? mapSeoRow(seoRow) : null,
    pageViews,
  });
}

export async function fetchRecommendedPostsViaSupabase(
  currentPostId: string,
  categoryId?: string
): Promise<RecommendedPostCard[]> {
  const params: Record<string, string> = {
    select: "slug,title,titleEn,coverImage,coverImageAlt,publishedAt",
    and: supabasePublishedVisibilityAnd(),
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
    postCache,
    PUBLIC_KEY
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
      and: supabasePublishedVisibilityAnd(),
      order: "publishedAt.desc",
      limit: String(limit),
    },
    [],
    undefined,
    postCache,
    PUBLIC_KEY
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
        and: supabasePublishedVisibilityAnd(),
        order: "updatedAt.desc",
        limit: String(take),
        offset: String(offset),
      },
      [],
      undefined,
      cache,
      PUBLIC_KEY
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
