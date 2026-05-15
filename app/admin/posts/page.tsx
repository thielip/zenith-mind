// app/admin/posts/page.tsx — 文章列表
// Cache：no-store（即時），模式 B

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/infrastructure/db/prisma";
import AdminPostsNotice from "@/components/admin/AdminPostsNotice";
import PostDeleteButton from "@/components/admin/PostDeleteButton";

export const metadata: Metadata = { title: "文章管理 | Admin" };

// ⚠ Admin：模式 B，不設 revalidate
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 50;

export default async function AdminPostsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
    where:   { deletedAt: null },
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where: { deletedAt: null } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const STATUS_LABEL: Record<string, string> = {
    DRAFT:     "草稿",
    PUBLISHED: "已發布",
    SCHEDULED: "排程中",
    ARCHIVED:  "已封存",
  };

  const STATUS_COLOR: Record<string, string> = {
    DRAFT:     "bg-gray-100 text-gray-600",
    PUBLISHED: "bg-green-100 text-green-700",
    SCHEDULED: "bg-yellow-100 text-yellow-700",
    ARCHIVED:  "bg-red-100 text-red-600",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">文章管理</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + 新增文章
        </Link>
      </div>

      <AdminPostsNotice />

      <p className="mb-4 text-sm text-gray-500">
        顯示第 {page} / {totalPages} 頁，共 {total.toLocaleString()} 篇文章。
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100" aria-label="文章列表">
          <thead className="bg-gray-50">
            <tr>
              {["標題", "分類", "狀態", "發布時間", "操作"].map((h) => (
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
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="max-w-xs px-5 py-4">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {post.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    /{post.slug}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">
                  {post.category?.name ?? "—"}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[post.status] ?? ""}`}
                  >
                    {STATUS_LABEL[post.status] ?? post.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-400">
                  {post.publishedAt
                    ? post.publishedAt.toLocaleDateString("zh-TW")
                    : "—"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`編輯文章：${post.title}`}
                  >
                    編輯
                  </Link>
                    <PostDeleteButton postId={post.id} title={post.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {posts.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            尚無文章，請點擊「新增文章」開始建立。
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-end gap-2" aria-label="文章分頁">
          {page > 1 && (
            <Link
              href={`/admin/posts?page=${page - 1}`}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              上一頁
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/admin/posts?page=${page + 1}`}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              下一頁
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
