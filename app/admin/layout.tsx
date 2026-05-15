// app/admin/layout.tsx — Server Component
// Admin Layout：已登入顯示側邊欄；公開 admin 頁（login / totp）直接渲染
// ⚠ 禁止 'use client'（Layout 必須是 Server Component）

import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader  from "@/components/admin/AdminHeader";
import SilentRefresh from "@/components/analytics/SilentRefresh";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

interface Props {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: Props) {
  // Protected routes 由 middleware 守衛；這裡避免 /admin/login 被自己 redirect 成 loop。
  const jar   = await cookies();
  const token = jar.get("access_token")?.value;

  let userEmail = "";
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      userEmail     = payload.email;
    } catch {
      return <>{children}</>;
    }
  }

  if (!userEmail) return <>{children}</>;

  return (
    <>
      <SilentRefresh />
      <AdminShell userEmail={userEmail}>{children}</AdminShell>
    </>
  );
}

function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 側邊欄（固定）*/}
      <AdminSidebar />

      {/* 主內容區 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader userEmail={userEmail} />

        <main
          id="admin-main"
          className="flex-1 overflow-y-auto p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
