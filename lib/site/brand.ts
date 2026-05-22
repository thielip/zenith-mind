import { isBlockedImageHost } from "@/lib/validation/blocked-image-hosts";

/** 站內靜態品牌資源路徑（public/ 下檔名須全小寫，避免 Linux 404） */
export const DEFAULT_SITE_LOGO_PATH = "/logo.png" as const;

export function resolveSiteLogoSrc(logoUrl: string | null | undefined): string {
  const trimmed = logoUrl?.trim();
  if (!trimmed) return DEFAULT_SITE_LOGO_PATH;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    if (isBlockedImageHost(new URL(trimmed).hostname)) {
      return DEFAULT_SITE_LOGO_PATH;
    }
  } catch {
    return DEFAULT_SITE_LOGO_PATH;
  }
  return trimmed;
}

export function absoluteSiteLogoUrl(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${DEFAULT_SITE_LOGO_PATH}`;
}
