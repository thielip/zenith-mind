import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck, SlidersHorizontal, UserCog, Users } from "lucide-react";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { prisma } from "@/infrastructure/db/prisma";

export const metadata: Metadata = { title: "設定 | Admin" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ totp?: string }>;
}

export default async function SettingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/admin/login");

  const payload = await verifyAccessToken(token).catch(() => null);
  if (!payload) redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true, role: true, totpEnabled: true, createdAt: true },
  });
  if (!user) redirect("/admin/login");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">設定</h1>
      <p className="mt-2 text-sm text-gray-500">管理後台帳號安全與網站主要設定入口。</p>
      {sp.totp === "activated" && (
        <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          雙因素驗證已成功啟用。
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <UserCog className="text-blue-600" size={24} aria-hidden="true" />
          <h2 className="mt-4 text-base font-semibold text-gray-900">帳號資訊</h2>
          <dl className="mt-3 space-y-2 text-sm text-gray-600">
            <div><dt className="inline font-medium">Email：</dt><dd className="inline">{user.email}</dd></div>
            <div><dt className="inline font-medium">角色：</dt><dd className="inline">{user.role}</dd></div>
          </dl>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">變更密碼</h3>
          <ChangePasswordForm />
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <Users className="text-indigo-600" size={24} aria-hidden="true" />
          <h2 className="mt-4 text-base font-semibold text-gray-900">使用者管理</h2>
          <p className="mt-2 text-sm text-gray-500">新增後台帳號、重設他人密碼或停用使用者。</p>
          <Link
            href="/admin/users"
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            管理使用者
          </Link>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <ShieldCheck className="text-emerald-600" size={24} aria-hidden="true" />
          <h2 className="mt-4 text-base font-semibold text-gray-900">雙因素驗證</h2>
          <p className="mt-2 text-sm text-gray-500">
            目前狀態：{user.totpEnabled ? "已啟用" : "未啟用"}
          </p>
          {!user.totpEnabled && (
            <Link
              href="/admin/settings/totp-setup"
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              設定 2FA
            </Link>
          )}
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <SlidersHorizontal className="text-purple-600" size={24} aria-hidden="true" />
          <h2 className="mt-4 text-base font-semibold text-gray-900">網站版型設定</h2>
          <p className="mt-2 text-sm text-gray-500">LOGO、輪播、社群側邊欄與 Quick Access Bar。</p>
          <Link
            href="/admin/site"
            className="mt-4 inline-flex rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            前往首頁版型 CMS
          </Link>
        </article>
      </div>
    </div>
  );
}
