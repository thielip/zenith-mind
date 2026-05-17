import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { listAdminUsers } from "@/domain/auth/user.service";
import { UsersManager } from "@/components/admin/UsersManager";

export const metadata: Metadata = { title: "使用者管理 | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/admin/login");

  const payload = await verifyAccessToken(token).catch(() => null);
  if (!payload) redirect("/admin/login");

  const users = await listAdminUsers();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">使用者管理</h1>
          <p className="mt-2 text-sm text-gray-500">
            新增後台帳號、重設密碼或停用使用者。建議登入後至「設定」變更自己的密碼。
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← 返回設定
        </Link>
      </div>

      <div className="mt-6">
        <UsersManager
          users={users.map((u) => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
          }))}
          currentUserId={payload.userId}
        />
      </div>
    </div>
  );
}
