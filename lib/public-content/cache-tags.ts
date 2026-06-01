import { unstable_cache } from "next/cache";

/** 與 revalidateTag / purge-public-site 對齊的公開讀取快取標籤 */
export const PUBLIC_READ_CACHE_TAGS = {
  posts: ["posts", "blog"] as const,
  siteSettings: ["site-settings"] as const,
  heroSlides: ["hero-slides"] as const,
  homeCarousel: ["home-carousel"] as const,
  sitemap: ["posts", "sitemap"] as const,
  affiliates: ["affiliate-links"] as const,
} as const;

const DEFAULT_REVALIDATE = 3600;

/**
 * Vercel（Prisma）公開讀取：以 unstable_cache 掛 tag，與 Supabase fetch `next.tags` 對齊。
 * CF Worker 不使用此函式（走 Supabase fetch cache）。
 */
export function cachePublicRead<T>(
  keyParts: string[],
  tags: readonly string[],
  fn: () => Promise<T>,
  revalidate = DEFAULT_REVALIDATE
): Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate,
    tags: [...tags],
  })();
}
