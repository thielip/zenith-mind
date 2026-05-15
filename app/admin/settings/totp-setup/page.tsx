// app/admin/settings/totp-setup/page.tsx — TOTP 初始設定
// 產生 QR Code，使用者掃描後驗證成功才啟用

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { generateTotpSecret } from "@/lib/auth/totp";
import { prisma } from "@/infrastructure/db/prisma";
import TotpSetupForm from "@/components/admin/TotpSetupForm";

export const metadata: Metadata = { title: "設定雙因素驗證 | Admin" };

export default async function TotpSetupPage() {
  const jar   = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) redirect("/admin/login");

  const payload = await verifyAccessToken(token).catch(() => null);
  if (!payload)  redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where:  { id: payload.userId },
    select: { email: true, totpEnabled: true },
  });
  if (!user) redirect("/admin/login");

  // 如果已啟用，導向設定頁
  if (user.totpEnabled) {
    redirect("/admin/settings");
  }

  // 產生新的 TOTP secret（每次頁面載入都重新產生，未驗證前不存 DB）
  const { qrCodeUrl, base32, encrypted } = await generateTotpSecret(user.email);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">設定雙因素驗證（2FA）</h1>
      <TotpSetupForm
        qrCodeUrl={qrCodeUrl}
        base32={base32}
        encryptedSecret={encrypted}
        userId={payload.userId}
      />
    </div>
  );
}
