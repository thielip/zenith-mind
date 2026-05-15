import { unstable_cache } from "next/cache";
import { getHeroSlides, getHomeCarouselItems } from "@/lib/site/hero-carousel-queries";
import type { HeroSlideData, HomeCarouselItemData, SiteLocale } from "@/lib/site/types";

/** 首頁專用：帶 cache tag，CMS 儲存後以 revalidateTag('hero-slides') 立即更新 */
export function getHeroSlidesForHomepage(locale: SiteLocale): Promise<HeroSlideData[]> {
  return unstable_cache(
    async () => getHeroSlides(locale, false),
    ["home-hero-slides", locale],
    { revalidate: 3600, tags: ["hero-slides"] }
  )();
}

/** 首頁專用：帶 cache tag，CMS 儲存後以 revalidateTag('home-carousel') 立即更新 */
export function getHomeCarouselForHomepage(locale: SiteLocale): Promise<HomeCarouselItemData[]> {
  return unstable_cache(
    async () => getHomeCarouselItems(locale, false),
    ["home-carousel-items", locale],
    { revalidate: 3600, tags: ["home-carousel"] }
  )();
}
