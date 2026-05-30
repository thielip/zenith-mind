"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Eye, Search } from "lucide-react";
import PostDeleteButton from "@/components/admin/PostDeleteButton";
import CopyPathButton from "@/components/admin/posts/CopyPathButton";
import PostStatusBadge from "@/components/admin/posts/PostStatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AdminPostListRow, AdminTopicStat } from "@/lib/admin/load-posts-list";
import {
  ADMIN_POST_STATUS_OPTIONS,
  ADMIN_POSTS_PER_PAGE_OPTIONS,
  buildAdminPostsListQuery,
  type AdminPostsListParams,
  type AdminPostsPerPage,
} from "@/lib/admin/posts-list-params";
import { cn } from "@/shared/lib/cn";

interface Props {
  posts: AdminPostListRow[];
  total: number;
  page: number;
  perPage: AdminPostsPerPage;
  totalPages: number;
  topicStats: AdminTopicStat[];
  params: AdminPostsListParams;
}

function formatDateZh(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("zh-TW");
}

function formatDateTimeZh(iso: string | null): string {
  if (!iso) return "尚未發布";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export default function AdminPostsList({
  posts,
  total,
  page,
  perPage,
  totalPages,
  topicStats,
  params,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [keyword, setKeyword] = useState(params.q);

  useEffect(() => {
    setKeyword(params.q);
  }, [params.q]);

  const navigate = useCallback(
    (patch: Partial<AdminPostsListParams>) => {
      const href = buildAdminPostsListQuery(params, {
        ...patch,
        page: patch.page ?? (patch.q !== undefined || patch.status !== undefined || patch.categorySlug !== undefined || patch.perPage !== undefined ? 1 : params.page),
      });
      startTransition(() => router.push(href));
    },
    [params, router]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (keyword === params.q) return;
      navigate({ q: keyword, page: 1 });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [keyword, params.q, navigate]);

  const paginationPages = useMemo(() => pageNumbers(page, totalPages), [page, totalPages]);

  const publicPath = (slug: string) => `/zh-TW/blog/${slug}`;

  return (
    <TooltipProvider>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {topicStats.map((topic) => {
          const selected = params.categorySlug === topic.slug;
          return (
            <button
              key={topic.slug}
              type="button"
              onClick={() =>
                navigate({
                  categorySlug: selected ? null : topic.slug,
                  page: 1,
                })
              }
              className={cn(
                "rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition",
                selected
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
              )}
            >
              <p className="text-sm font-semibold text-gray-900">{topic.name}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-blue-700">
                {topic.count}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">篇（含草稿）</p>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {params.categorySlug || params.q || params.status !== "all" ? (
          <button
            type="button"
            onClick={() =>
              navigate({ categorySlug: null, q: "", status: "all", page: 1 })
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            顯示全部
          </button>
        ) : null}
        <p className="text-sm text-gray-500">
          第 {page} / {totalPages} 頁，共 {total.toLocaleString()} 篇
          {params.categorySlug
            ? `（${topicStats.find((t) => t.slug === params.categorySlug)?.name ?? ""}）`
            : ""}
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-end">
        <label className="block min-w-0 flex-1">
          <span className="mb-1 block text-xs font-semibold text-gray-600">
            關鍵字（標題或 Slug）
          </span>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate({ q: keyword, page: 1 });
              }}
              placeholder="輸入標題或 slug…"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </label>

        <label className="block w-full lg:w-40">
          <span className="mb-1 block text-xs font-semibold text-gray-600">狀態</span>
          <select
            value={params.status}
            onChange={(e) =>
              navigate({
                status: e.target.value as AdminPostsListParams["status"],
                page: 1,
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {ADMIN_POST_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block w-full lg:w-44">
          <span className="mb-1 block text-xs font-semibold text-gray-600">分類</span>
          <select
            value={params.categorySlug ?? ""}
            onChange={(e) =>
              navigate({
                categorySlug: e.target.value || null,
                page: 1,
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">全部分類</option>
            {topicStats.map((topic) => (
              <option key={topic.slug} value={topic.slug}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100" aria-label="文章列表">
          <thead className="bg-gray-50">
            <tr>
              {["標題", "分類", "狀態", "發布/排程時間", "操作"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {posts.map((post) => {
              const path = publicPath(post.slug);
              const canViewPublic = post.status === "PUBLISHED";
              const displayDate =
                post.status === "SCHEDULED" && post.scheduledAt
                  ? post.scheduledAt
                  : post.publishedAt ?? post.createdAt;

              return (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="max-w-md px-5 py-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="truncate text-sm font-medium text-gray-900 hover:text-blue-700"
                      >
                        {post.title}
                      </Link>
                      <span className="shrink-0 text-xs text-gray-400">/{post.slug}</span>
                      <CopyPathButton path={path} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {post.categoryName ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <PostStatusBadge status={post.status} />
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default border-b border-dotted border-gray-300">
                          {post.status === "SCHEDULED"
                            ? formatDateTimeZh(post.scheduledAt)
                            : formatDateZh(post.publishedAt)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{formatDateTimeZh(displayDate)}</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {canViewPublic ? (
                        <a
                          href={path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          aria-label={`前台查看：${post.title}`}
                          title="前台查看"
                        >
                          <Eye size={14} aria-hidden />
                          查看
                        </a>
                      ) : (
                        <span
                          className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-gray-100 px-2 py-1 text-xs text-gray-300"
                          title="僅已發布的文章可於前台查看"
                        >
                          <Eye size={14} aria-hidden />
                          查看
                        </span>
                      )}
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        編輯
                      </Link>
                      <PostDeleteButton postId={post.id} title={post.title} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {posts.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            找不到符合條件的文章。
          </div>
        )}
      </div>

      <nav
        className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        aria-label="文章分頁"
      >
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span>每頁</span>
          <select
            value={perPage}
            onChange={(e) =>
              navigate({
                perPage: Number(e.target.value) as AdminPostsPerPage,
                page: 1,
              })
            }
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
          >
            {ADMIN_POSTS_PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} 筆
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center justify-end gap-1">
          {page > 1 ? (
            <Link
              href={buildAdminPostsListQuery(params, { page: page - 1 })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              上一頁
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-300">
              上一頁
            </span>
          )}

          {paginationPages.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e-${i}`} className="px-2 text-sm text-gray-400">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={buildAdminPostsListQuery(params, { page: p })}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "min-w-[2.25rem] rounded-lg border px-3 py-2 text-center text-sm",
                  p === page
                    ? "border-blue-600 bg-blue-600 font-semibold text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {p}
              </Link>
            )
          )}

          {page < totalPages ? (
            <Link
              href={buildAdminPostsListQuery(params, { page: page + 1 })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              下一頁
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-300">
              下一頁
            </span>
          )}
        </div>
      </nav>
    </TooltipProvider>
  );
}
