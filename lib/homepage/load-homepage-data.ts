import { safeQuery } from "@/lib/db/safe-query";
import {
  getHeroSlidesForHomepage,
  getHomeCarouselForHomepage,
} from "@/lib/site/homepage-data-cache";
import { getPublicReadRepository } from "@/lib/public-content/get-repository";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site/queries";
import type {
  AffiliateLinkItem,
  FeaturedPostItem,
} from "@/lib/homepage/homepage-types";
import type { SiteLocale, SiteSettingsData } from "@/lib/site/types";

export type { AffiliateLinkItem, FeaturedPostItem } from "@/lib/homepage/homepage-types";

const EMPTY_POSTS: FeaturedPostItem[] = [];
const EMPTY_AFFILIATES: AffiliateLinkItem[] = [];

export type HomepageData = {
  featuredPosts: FeaturedPostItem[];
  heroSlides: Awaited<ReturnType<typeof getHeroSlidesForHomepage>>;
  carouselItems: Awaited<ReturnType<typeof getHomeCarouselForHomepage>>;
  publishedPostCount: number;
  categoryCount: number;
  affiliateLinks: AffiliateLinkItem[];
  siteSettings: SiteSettingsData;
  homePageViews: number;
};

/** 首頁區塊各自降級；資料平面由 PublicReadRepository 統一分派 */
export async function loadHomepageData(
  siteLocale: SiteLocale
): Promise<HomepageData> {
  const repo = await getPublicReadRepository();

  const [
    featuredPosts,
    heroSlides,
    carouselItems,
    publishedPostCount,
    categoryCount,
    affiliateLinks,
    siteSettings,
    homePageViews,
  ] = await Promise.all([
    safeQuery("homepage.featuredPosts", () => repo.loadFeaturedPosts(), EMPTY_POSTS),
    safeQuery("homepage.heroSlides", () => getHeroSlidesForHomepage(siteLocale), []),
    safeQuery(
      "homepage.carousel",
      () => getHomeCarouselForHomepage(siteLocale),
      []
    ),
    safeQuery("homepage.postCount", () => repo.countPublishedPosts(), 0),
    safeQuery("homepage.categoryCount", () => repo.countCategories(), 0),
    safeQuery(
      "homepage.affiliateLinks",
      () => repo.loadAffiliateLinksForHome(),
      EMPTY_AFFILIATES
    ),
    safeQuery("homepage.siteSettings", () => repo.getSiteSettings(), DEFAULT_SITE_SETTINGS),
    safeQuery("homepage.pageViews", () => repo.countHomePageViews(siteLocale), 0),
  ]);

  return {
    featuredPosts,
    heroSlides,
    carouselItems,
    publishedPostCount,
    categoryCount,
    affiliateLinks,
    siteSettings,
    homePageViews,
  };
}
