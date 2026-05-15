/** 正式站預設網址（建置階段未注入 env 時的 fallback，避免 metadataBase Invalid URL） */
export const DEFAULT_PRODUCTION_SITE_URL =
  "https://www.getzenithmind.com" as const;

export function getPublicSiteUrl(): string {
  const fromEnv = process.env["NEXT_PUBLIC_SITE_URL"]?.trim();
  return fromEnv || DEFAULT_PRODUCTION_SITE_URL;
}
