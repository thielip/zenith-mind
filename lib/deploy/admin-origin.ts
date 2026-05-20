/** Cloudflare 公開站：後台／後台 API 導向 Vercel（由 ADMIN_DEPLOYMENT_URL 控制） */

const ADMIN_PATH_PREFIXES = [
  "/admin",
  "/api/admin",
  "/api/ai",
  "/api/auth",
  "/api/cron",
] as const;

/** 後台／後台 API 路徑（不依賴 env；供 canonical 轉址排除用） */
export function isAdminDeploymentPath(pathname: string): boolean {
  return ADMIN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getAdminDeploymentUrl(): string | null {
  const raw = process.env["ADMIN_DEPLOYMENT_URL"]?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function isAdminDeploymentSplitEnabled(): boolean {
  return getAdminDeploymentUrl() !== null;
}

export function shouldProxyAdminToExternal(pathname: string): boolean {
  if (!isAdminDeploymentSplitEnabled()) return false;
  return isAdminDeploymentPath(pathname);
}

export function buildAdminExternalUrl(
  pathname: string,
  search: string
): string | null {
  const base = getAdminDeploymentUrl();
  if (!base) return null;
  return `${base}${pathname}${search}`;
}
