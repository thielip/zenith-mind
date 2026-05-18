/**
 * 部落格列表（Cloudflare Worker）：Neon serverless SQL。
 * 禁止 import @/infrastructure/db/prisma。
 */
import { getNeonSql } from "@/lib/db/neon-http";
import type {
  BlogListCategory,
  BlogListFilters,
  BlogListPost,
  BlogListTag,
} from "@/lib/blog/blog-list-types";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: Date | null;
  readingTime: number;
  catSlug: string | null;
  catName: string | null;
  catNameEn: string | null;
  pageViews: number;
};

const POST_SELECT = `
  SELECT
    p.id,
    p.slug,
    p.title,
    p."titleEn",
    p.excerpt,
    p."excerptEn",
    p."coverImage",
    p."coverImageAlt",
    p."publishedAt",
    p."readingTime",
    c.slug AS "catSlug",
    c.name AS "catName",
    c."nameEn" AS "catNameEn",
    0::int AS "pageViews"
  FROM posts p
  LEFT JOIN categories c ON c.id = p."categoryId"
`;

function parsePublishedAt(value: Date | null): Date | null {
  if (!value) return null;
  return Number.isNaN(value.getTime()) ? null : value;
}

function buildFilterSql(filters: BlogListFilters) {
  const parts: string[] = [
    `p.status::text = 'PUBLISHED'`,
    `p."deletedAt" IS NULL`,
  ];
  const values: unknown[] = [];

  if (filters.category) {
    values.push(filters.category);
    parts.push(`c.slug = $${values.length}`);
  }

  if (filters.tag) {
    values.push(filters.tag);
    parts.push(`EXISTS (
      SELECT 1 FROM post_tags pt
      INNER JOIN tags t ON t.id = pt."tagId"
      WHERE pt."postId" = p.id AND t.slug = $${values.length} AND t."deletedAt" IS NULL
    )`);
  }

  const q = filters.query?.trim() ?? "";
  if (q) {
    values.push(`%${q}%`);
    const n = values.length;
    parts.push(`(
      p.title ILIKE $${n} OR p."titleEn" ILIKE $${n}
      OR p.excerpt ILIKE $${n} OR p."excerptEn" ILIKE $${n}
    )`);
  }

  return { where: parts.join(" AND "), values };
}

function mapPostRow(row: PostRow, tags: { tag: BlogListTag }[]): BlogListPost {
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
    category: row.catSlug
      ? { slug: row.catSlug, name: row.catName ?? "", nameEn: row.catNameEn }
      : null,
    tags,
    _count: { pageViews: Number(row.pageViews) || 0 },
  };
}

async function fetchTagsForPosts(
  sql: NonNullable<ReturnType<typeof getNeonSql>>,
  postIds: string[]
): Promise<Map<string, { tag: BlogListTag }[]>> {
  const byPost = new Map<string, { tag: BlogListTag }[]>();
  if (postIds.length === 0) return byPost;

  const rows = (await sql.query(
    `
    SELECT pt."postId" AS "postId", t.slug, t.name, t."nameEn"
    FROM post_tags pt
    INNER JOIN tags t ON t.id = pt."tagId"
    WHERE pt."postId" = ANY($1::text[])
      AND t."deletedAt" IS NULL
    ORDER BY t.name ASC
    `,
    [postIds]
  )) as { postId: string; slug: string; name: string; nameEn: string | null }[];

  for (const row of rows) {
    const list = byPost.get(row.postId) ?? [];
    if (list.length >= 3) continue;
    list.push({ tag: { slug: row.slug, name: row.name, nameEn: row.nameEn } });
    byPost.set(row.postId, list);
  }
  return byPost;
}

export async function loadBlogListDataViaNeon(
  filters: BlogListFilters,
  skip: number,
  perPage: number
): Promise<{
  posts: BlogListPost[];
  total: number;
  categories: BlogListCategory[];
  tags: BlogListTag[];
}> {
  const sql = getNeonSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");

  const { where, values } = buildFilterSql(filters);

  const posts = (await sql.query(
    `${POST_SELECT}
     WHERE ${where}
     ORDER BY p."publishedAt" DESC NULLS LAST, p."createdAt" DESC
     LIMIT ${perPage} OFFSET ${skip}`,
    values
  )) as PostRow[];

  const countRows = (await sql.query(
    `
    SELECT COUNT(*)::int AS count
    FROM posts p
    LEFT JOIN categories c ON c.id = p."categoryId"
    WHERE ${where}
    `,
    values
  )) as { count: number }[];

  const categories = (await sql`
    SELECT slug, name, "nameEn"
    FROM categories
    WHERE "deletedAt" IS NULL
    ORDER BY name ASC
  `) as BlogListCategory[];

  const tags = (await sql`
    SELECT slug, name, "nameEn"
    FROM tags
    WHERE "deletedAt" IS NULL
    ORDER BY name ASC
    LIMIT 18
  `) as BlogListTag[];

  const tagsByPostId = await fetchTagsForPosts(sql, posts.map((p) => p.id));

  return {
    posts: posts.map((row) => mapPostRow(row, tagsByPostId.get(row.id) ?? [])),
    total: countRows[0]?.count ?? 0,
    categories,
    tags,
  };
}
