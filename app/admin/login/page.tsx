// app/admin/login/page.tsx — 登入頁（無 Admin Layout）
// 此頁面不在 admin/layout.tsx 內，獨立存在

import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "登入 | 巔峰思維 Admin" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">巔峰思維</h1>
          <p className="mt-1 text-sm text-gray-700">Admin 後台登入</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
