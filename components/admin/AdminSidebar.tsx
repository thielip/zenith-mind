// components/admin/AdminSidebar.tsx — Client Component
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Image, Link2,
  ClipboardList, Settings, LogOut, PanelsTopLeft,
} from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { useTransition } from "react";
import { clearAdminSessionHint } from "@/lib/auth/client-session";

const NAV = [
  { href: "/admin/dashboard",  label: "儀表板",   icon: LayoutDashboard },
  { href: "/admin/site",       label: "首頁版型",  icon: PanelsTopLeft },
  { href: "/admin/posts",      label: "文章管理",  icon: FileText },
  { href: "/admin/media",      label: "媒體庫",    icon: Image },
  { href: "/admin/affiliate",  label: "聯盟連結",  icon: Link2 },
  { href: "/admin/audit-log",  label: "操作紀錄",  icon: ClipboardList },
  { href: "/admin/settings",   label: "設定",     icon: Settings },
] as const;

export default function AdminSidebar() {
  const pathname      = usePathname();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      clearAdminSessionHint();
      window.location.href = "/admin/login";
    });
  }

  return (
    <aside
      className="flex w-56 shrink-0 flex-col bg-gray-900"
      aria-label="Admin 導覽選單"
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <span className="text-sm font-bold text-white">⚡ 巔峰思維 Admin</span>
      </div>

      {/* 導覽列表 */}
      <nav className="flex-1 px-3 py-2" aria-label="主要導覽">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-blue-400",
                    isActive
                      ? "bg-gray-700 text-white font-medium"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white",
                  ].join(" ")}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 登出按鈕 */}
      <div className="border-t border-gray-700 px-3 py-3">
        <button
          onClick={handleLogout}
          disabled={pending}
          aria-label="登出 Admin"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          <LogOut size={16} aria-hidden="true" />
          {pending ? "登出中…" : "登出"}
        </button>
      </div>
    </aside>
  );
}
