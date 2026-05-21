// app/admin/posts/page.tsx — 文章列表
// Cache：no-store（即時），模式 B

import type { Metadata } from "next";
import Link from "next/link";
import AdminPostsNotice from "@/components/admin/AdminPostsNotice";
import AdminPostsList from "@/components/admin/posts/AdminPostsList";
import { loadAdminPostsList } from "@/lib/admin/load-posts-list";
import { parseAdminPostsListParams } from "@/lib/admin/posts-list-params";

export const metadata: Metadata = { title: "文章管理 | Admin" };

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminPostsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = parseAdminPostsListParams(sp);
  const { posts, total, totalPages, topicStats } = await loadAdminPostsList(params);

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

      <AdminPostsList
        posts={posts}
        total={total}
        page={params.page}
        perPage={params.perPage}
        totalPages={totalPages}
        topicStats={topicStats}
        params={params}
      />
    </div>
  );
}
