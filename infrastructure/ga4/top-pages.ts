import type { TopPageMetric } from "@/infrastructure/ga4/reporting.client";

/** GA4 可能回傳重複 path（如 /zh-TW），合併並保留較高瀏覽量 */
export function dedupeTopPages(pages: TopPageMetric[]): TopPageMetric[] {
  const map = new Map<string, TopPageMetric>();
  for (const page of pages) {
    const key = page.path || page.title;
    const existing = map.get(key);
    if (!existing || page.views > existing.views) {
      map.set(key, page);
    }
  }
  return [...map.values()].sort((a, b) => b.views - a.views);
}
