// app/admin/layout.tsx ? Server Component

import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import GuestReadOnlyBanner from "@/components/admin/GuestReadOnlyBanner";
import { AdminMainFrame } from "@/components/admin/AdminMainFrame";
import SilentRefresh from "@/components/analytics/SilentRefresh";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export const dynamic = "force-dynamic";

interface Props {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: Props) {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;

  let userEmail = "";
  let readOnly = false;
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      userEmail = payload.email;
      readOnly = payload.role === "GUEST";
    } catch {
      return <>{children}</>;
    }
  }

  if (!userEmail) return <>{children}</>;

  return (
    <>
      <SilentRefresh />
      <AdminShell userEmail={userEmail} readOnly={readOnly}>
        {children}
      </AdminShell>
    </>
  );
}

function AdminShell({
  userEmail,
  readOnly,
  children,
}: {
  userEmail: string;
  readOnly: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#05070F]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader userEmail={userEmail} />
        <AdminMainFrame>
          {readOnly && <GuestReadOnlyBanner />}
          {children}
        </AdminMainFrame>
      </div>
    </div>
  );
}

