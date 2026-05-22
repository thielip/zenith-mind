/** 正式站預設網址（建置階段未注入 env 時的 fallback，避免 metadataBase Invalid URL） */
export const DEFAULT_PRODUCTION_SITE_URL =
  "https://www.getzenithmind.com" as const;

/** 後台「回到首頁」固定連結（勿依賴 Vercel 後台的 NEXT_PUBLIC_SITE_URL） */
export const PUBLIC_ZH_TW_HOME_URL =
  "https://www.getzenithmind.com/zh-TW" as const;

export function getPublicSiteUrl(): string {
  const fromEnv = process.env["NEXT_PUBLIC_SITE_URL"]?.trim();
  return fromEnv || DEFAULT_PRODUCTION_SITE_URL;
}

/** 公開站語系首頁（metadata、一般連結用） */
export function getPublicLocaleHomeUrl(locale: "zh-TW" | "en" = "zh-TW"): string {
  if (locale === "zh-TW") return PUBLIC_ZH_TW_HOME_URL;
  return `${getPublicSiteUrl().replace(/\/$/, "")}/en`;
}
