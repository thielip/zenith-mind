/**
 * Redirect 查詢略過規則（集中管理）
 * Middleware 命中時應立即 return null，避免不必要的 DB 查詢。
 */

/** 路徑前綴：命中即略過 */
export const REDIRECT_SKIP_PREFIXES = [
  "/_next",
  "/api",
  "/images",
  "/assets",
] as const;

/** 精確路徑：命中即略過 */
export const REDIRECT_SKIP_EXACT = [
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
] as const;

/** 靜態副檔名（小寫比對） */
export const REDIRECT_STATIC_EXTENSIONS =
  /\.(js|css|png|jpe?g|svg|webp|ico|woff2?|gif|map)$/i;

/** 額外業務路徑前綴（後台、聯盟短鏈） */
export const REDIRECT_SKIP_APP_PREFIXES = ["/admin", "/go/"] as const;

export function shouldSkipRedirectLookup(pathname: string): boolean {
  if (!pathname || pathname === "/") return true;

  for (const exact of REDIRECT_SKIP_EXACT) {
    if (pathname === exact) return true;
  }

  for (const prefix of REDIRECT_SKIP_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return true;
    }
  }

  for (const prefix of REDIRECT_SKIP_APP_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix)) return true;
  }

  if (REDIRECT_STATIC_EXTENSIONS.test(pathname)) return true;

  return false;
}
