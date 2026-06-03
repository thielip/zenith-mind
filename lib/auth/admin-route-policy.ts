// lib/auth/admin-route-policy.ts — Edge / Node 共用後台路由 RBAC（無 Node 專用依賴）

import type { UserRole } from "@/lib/auth/permissions";

/** 不需 JWT 的後台頁面 */
export const ADMIN_PUBLIC_PAGE_PREFIXES = ["/admin/login", "/admin/totp"] as const;

/**
 * 僅 ADMIN 可進入的頁面（GUEST 為唯讀協作者，禁止寫入與高權限模組）
 * 對齊 gateAdminOnly / canWriteAdminEntity 與側欄敏感功能
 */
export const ADMIN_ONLY_PAGE_PREFIXES = [
  "/admin/posts/new",
  "/admin/users",
  "/admin/settings/totp-setup",
  "/admin/totp",
  "/admin/dashboard/agents",
] as const;

/** 需 JWT 的後台 API 前綴（Vercel；CF 會 302 至 ADMIN_DEPLOYMENT_URL） */
export const ADMIN_AUTHENTICATED_API_PREFIXES = ["/api/admin", "/api/ai"] as const;

/**
 * 僅 ADMIN 的 API（敏感讀寫：探測、env、稽核匯出、即時串流、AI）
 * 其餘 /api/admin 允許 GUEST 讀取類端點（若未來新增須審查）
 */
export const ADMIN_ONLY_API_PREFIXES = [
  "/api/admin/audit-log/export",
  "/api/admin/env-check",
  "/api/admin/integrations/probe",
  "/api/admin/integrations/refresh-health",
  "/api/admin/realtime/stream",
  "/api/ai",
] as const;

function startsWithAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAdminPublicPage(pathname: string): boolean {
  return startsWithAny(pathname, ADMIN_PUBLIC_PAGE_PREFIXES);
}

/** 後台頁面（不含 login/totp） */
export function isAdminProtectedPage(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") &&
    !isAdminPublicPage(pathname)
  );
}

export function isAdminAuthenticatedApi(pathname: string): boolean {
  return startsWithAny(pathname, ADMIN_AUTHENTICATED_API_PREFIXES);
}

export function adminRouteRequiresAdminRole(pathname: string): boolean {
  return (
    startsWithAny(pathname, ADMIN_ONLY_PAGE_PREFIXES) ||
    startsWithAny(pathname, ADMIN_ONLY_API_PREFIXES)
  );
}

export function canAccessAdminRoute(pathname: string, role: UserRole): boolean {
  if (!adminRouteRequiresAdminRole(pathname)) return true;
  return role === "ADMIN";
}
