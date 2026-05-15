/** 站內靜態品牌資源路徑（public/ 下檔名須全小寫，避免 Linux 404） */
export const DEFAULT_SITE_LOGO_PATH = "/logo.png" as const;

export function resolveSiteLogoSrc(logoUrl: string | null | undefined): string {
  const trimmed = logoUrl?.trim();
  return trimmed || DEFAULT_SITE_LOGO_PATH;
}

export function absoluteSiteLogoUrl(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${DEFAULT_SITE_LOGO_PATH}`;
}
