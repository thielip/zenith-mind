export type PublicLocale = "zh-TW" | "en";

export function postArticlePath(locale: PublicLocale, slug: string): string {
  return `/${locale}/blog/${slug}`;
}

/** 刪除文章後 301 目標：優先導向同主題分類列表，否則文章列表 */
export function postDeleteRedirectTarget(
  locale: PublicLocale,
  categorySlug: string | null | undefined
): string {
  const base = `/${locale}/blog`;
  const slug = categorySlug?.trim();
  if (!slug) return base;
  return `${base}?category=${encodeURIComponent(slug)}`;
}

/** @deprecated 請改用 `@/lib/redirects/matcher` 的 shouldSkipRedirectLookup */
export { shouldSkipRedirectLookup } from "@/lib/redirects/matcher";
