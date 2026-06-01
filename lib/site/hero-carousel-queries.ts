import { getPublicReadRepository } from "@/lib/public-content/get-repository";
import type { HeroSlideData, HomeCarouselItemData, SiteLocale } from "@/lib/site/types";

export async function getHeroSlides(
  locale: SiteLocale,
  includeInactive = false
): Promise<HeroSlideData[]> {
  const repo = await getPublicReadRepository();
  return repo.getHeroSlides(locale, includeInactive);
}

export async function getHomeCarouselItems(
  locale: SiteLocale,
  includeInactive = false
): Promise<HomeCarouselItemData[]> {
  const repo = await getPublicReadRepository();
  return repo.getHomeCarouselItems(locale, includeInactive);
}
