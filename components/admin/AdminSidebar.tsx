"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { clearAdminSessionHint } from "@/lib/auth/client-session";
import {
  ADMIN_SIDEBAR_NAV,
  type AdminNavItem,
  type AdminNavLink,
  type AdminNavSubmenu,
} from "@/shared/config/admin-sidebar-nav";
import { cn } from "@/shared/lib/cn";

function isNavLinkActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function submenuHasActive(pathname: string, item: AdminNavSubmenu): boolean {
  return item.children.some((child) => isNavLinkActive(pathname, child.href));
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  nested,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isActive: boolean;
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
        nested ? "px-3 py-1.5" : "px-3 py-2",
        isActive
          ? "bg-cyan-500/20 font-semibold text-cyan-50 ring-1 ring-cyan-500/30"
          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
      )}
    >
      <Icon size={nested ? 14 : 16} aria-hidden className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavSubmenu({
  item,
  pathname,
}: {
  item: AdminNavSubmenu;
  pathname: string;
}) {
  const childActive = submenuHasActive(pathname, item);
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const Icon = item.icon;

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
          childActive
            ? "bg-slate-800/90 font-medium text-cyan-100"
            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
        )}
      >
        <Icon size={16} aria-hidden className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <ChevronDown
          size={14}
          aria-hidden
          className={cn(
            "shrink-0 text-slate-500 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <ul
            className="ml-4 space-y-0.5 border-l border-slate-700/80 py-1 pl-2"
            role="group"
            aria-label={`${item.label} 子選單`}
          >
            {item.children.map((child) => {
              const active = isNavLinkActive(pathname, child.href);
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-cyan-500/20 font-semibold text-cyan-50"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    )}
                  >
                    {child.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function NavItem({ item, pathname }: { item: AdminNavItem; pathname: string }) {
  if (item.type === "submenu") {
    return <NavSubmenu item={item} pathname={pathname} />;
  }
  const link = item as AdminNavLink;
  return (
    <NavLink
      href={link.href}
      label={link.label}
      icon={link.icon}
      isActive={isNavLinkActive(pathname, link.href, link.exact)}
    />
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

      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="後台導覽">
        {ADMIN_SIDEBAR_NAV.map((group, groupIndex) => (
          <div
            key={group.id}
            className={cn(groupIndex > 0 && "mt-5 border-t border-slate-800/70 pt-5")}
          >
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.type === "submenu" ? item.id : item.href}>
                  <NavItem item={item} pathname={pathname} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800/60 px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={pending}
          aria-label="登出 Admin"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50"
        >
          <LogOut size={16} aria-hidden />
          {pending ? "登出中…" : "登出"}
        </button>
      </div>
    </aside>
  );
}
