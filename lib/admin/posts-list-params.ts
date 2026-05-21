import type { PostStatus } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "@/lib/categories/defaults";

export const ADMIN_POSTS_PER_PAGE_OPTIONS = [20, 50, 100] as const;
export type AdminPostsPerPage = (typeof ADMIN_POSTS_PER_PAGE_OPTIONS)[number];

/** 後台主題看板顯示順序（與需求一致） */
export const ADMIN_TOPIC_SLUG_ORDER = [
  "ai-tech",
  "education",
  "international",
  "finance",
  "lifestyle",
  "other",
] as const;

const TOPIC_NAME_BY_SLUG = new Map<string, string>(
  DEFAULT_CATEGORIES.map((c) => [c.slug, c.name])
);

export const ADMIN_POST_STATUS_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "PUBLISHED", label: "已發布" },
  { value: "DRAFT", label: "草稿" },
  { value: "SCHEDULED", label: "排程中" },
  { value: "ARCHIVED", label: "已封存" },
] as const;

export interface AdminPostsListParams {
  page: number;
  perPage: AdminPostsPerPage;
  q: string;
  status: PostStatus | "all";
  categorySlug: string | null;
}

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseAdminPostsListParams(
  sp: Record<string, string | string[] | undefined>
): AdminPostsListParams {
  const page = Math.max(1, Number.parseInt(firstString(sp.page) ?? "1", 10) || 1);
  const perPageRaw = Number.parseInt(firstString(sp.perPage) ?? "20", 10);
  const perPage = ADMIN_POSTS_PER_PAGE_OPTIONS.includes(perPageRaw as AdminPostsPerPage)
    ? (perPageRaw as AdminPostsPerPage)
    : 20;

  const q = (firstString(sp.q) ?? "").trim();
  const statusRaw = firstString(sp.status) ?? "all";
  const status =
    statusRaw === "all" ||
    statusRaw === "DRAFT" ||
    statusRaw === "PUBLISHED" ||
    statusRaw === "SCHEDULED" ||
    statusRaw === "ARCHIVED"
      ? statusRaw
      : "all";

  const categoryRaw = (firstString(sp.category) ?? "").trim();
  const categorySlug =
    categoryRaw && ADMIN_TOPIC_SLUG_ORDER.includes(categoryRaw as (typeof ADMIN_TOPIC_SLUG_ORDER)[number])
      ? categoryRaw
      : null;

  return { page, perPage, q, status, categorySlug };
}

export function topicDisplayName(slug: string, dbName?: string | null): string {
  const fallback = TOPIC_NAME_BY_SLUG.get(slug);
  return dbName?.trim() || fallback || slug;
}

export function buildAdminPostsListQuery(
  params: AdminPostsListParams,
  patch: Partial<{
    page: number;
    perPage: AdminPostsPerPage;
    q: string;
    status: PostStatus | "all";
    categorySlug: string | null;
  }>
): string {
  const next = { ...params, ...patch };
  const search = new URLSearchParams();
  if (next.page > 1) search.set("page", String(next.page));
  if (next.perPage !== 20) search.set("perPage", String(next.perPage));
  if (next.q) search.set("q", next.q);
  if (next.status !== "all") search.set("status", next.status);
  if (next.categorySlug) search.set("category", next.categorySlug);
  const qs = search.toString();
  return qs ? `/admin/posts?${qs}` : "/admin/posts";
}
