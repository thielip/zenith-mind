// app/admin/totp/page.tsx — TOTP 驗證頁

import type { Metadata } from "next";
import TotpForm from "@/components/admin/TotpForm";

export const metadata: Metadata = { title: "雙因素驗證 | Admin" };

export default function TotpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">雙因素驗證</h1>
          <p className="mt-1 text-sm text-gray-500">
            請輸入 Authenticator App 上的 6 位數驗證碼
          </p>
        </div>
        <TotpForm />
      </div>
    </div>
  );
}
