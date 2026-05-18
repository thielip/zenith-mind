import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import {
  getHeroSlidesViaSupabase,
  getHomeCarouselItemsViaSupabase,
} from "@/lib/site/public-site-supabase";
import type { HeroSlideData, HomeCarouselItemData, SiteLocale } from "@/lib/site/types";

export async function getHeroSlides(
  locale: SiteLocale,
  includeInactive = false
): Promise<HeroSlideData[]> {
  if (isCfPublicRuntime()) {
    return getHeroSlidesViaSupabase(locale, includeInactive);
  }

  const { getHeroSlidesPrisma } = await import(
    "@/lib/site/hero-carousel-queries-prisma"
  );
  return getHeroSlidesPrisma(locale, includeInactive);
}

export async function getHomeCarouselItems(
  locale: SiteLocale,
  includeInactive = false
): Promise<HomeCarouselItemData[]> {
  if (isCfPublicRuntime()) {
    return getHomeCarouselItemsViaSupabase(locale, includeInactive);
  }

  const { getHomeCarouselItemsPrisma } = await import(
    "@/lib/site/hero-carousel-queries-prisma"
  );
  return getHomeCarouselItemsPrisma(locale, includeInactive);
}
