"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  Image,
  Link2,
  LogOut,
  PanelsTopLeft,
  Settings,
  Users,
} from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { useTransition } from "react";
import { clearAdminSessionHint } from "@/lib/auth/client-session";
import { COMMAND_CENTER_NAV } from "@/shared/config/command-center-nav";
import { cn } from "@/shared/lib/cn";

const CONTENT_NAV = [
  { href: "/admin/posts", label: "文章管理", icon: FileText },
  { href: "/admin/media", label: "媒體庫", icon: Image },
  { href: "/admin/site", label: "首頁版型", icon: PanelsTopLeft },
  { href: "/admin/affiliate", label: "聯盟連結", icon: Link2 },
  { href: "/admin/audit-log", label: "操作紀錄", icon: ClipboardList },
  { href: "/admin/users", label: "使用者管理", icon: Users },
  { href: "/admin/settings", label: "設定", icon: Settings },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
        isActive
          ? "bg-cyan-500/15 font-medium text-cyan-100"
          : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
      )}
    >
      <Icon size={16} aria-hidden />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
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
      className="flex w-60 shrink-0 flex-col border-r border-slate-800/80 bg-[#0B0F19]"
      aria-label="Admin 導覽選單"
    >
      <div className="flex h-14 items-center border-b border-slate-800/60 px-4">
        <span className="text-sm font-bold text-white">⚡ AI 行銷作戰中心</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="作戰中心">
        <p className="mb-2 px-2 text-[10px] font-mono uppercase tracking-widest text-cyan-500/70">
          AI 作戰中心
        </p>
        <ul className="space-y-0.5">
          {COMMAND_CENTER_NAV.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/admin/dashboard"
                ? pathname === "/admin/dashboard"
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <NavLink href={href} label={label} icon={Icon} isActive={isActive} />
              </li>
            );
          })}
        </ul>

        <p className="mb-2 mt-6 px-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          內容管理
        </p>
        <ul className="space-y-0.5">
          {CONTENT_NAV.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <NavLink
                href={href}
                label={label}
                icon={Icon}
                isActive={pathname.startsWith(href)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-slate-800/60 px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={pending}
          aria-label="登出 Admin"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50"
        >
          <LogOut size={16} aria-hidden />
          {pending ? "登出中…" : "登出"}
        </button>
      </div>
    </aside>
  );
}
