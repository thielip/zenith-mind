import { prisma } from "@/infrastructure/db/prisma";
import { safeQuery } from "@/lib/db/safe-query";
import {
  getHeroSlidesForHomepage,
  getHomeCarouselForHomepage,
} from "@/lib/site/homepage-data-cache";
import { getSafeSiteSettings } from "@/lib/site/safe-site-settings";
import type { SiteLocale, SiteSettingsData } from "@/lib/site/types";

const EMPTY_POSTS: Awaited<ReturnType<typeof loadFeaturedPosts>> = [];

async function loadFeaturedPosts() {
  return prisma.post.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      titleEn: true,
      excerpt: true,
      excerptEn: true,
      publishedAt: true,
      readingTime: true,
      category: { select: { name: true, nameEn: true, slug: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 6,
  });
}

export type HomepageData = {
  featuredPosts: Awaited<ReturnType<typeof loadFeaturedPosts>>;
  heroSlides: Awaited<ReturnType<typeof getHeroSlidesForHomepage>>;
  carouselItems: Awaited<ReturnType<typeof getHomeCarouselForHomepage>>;
  publishedPostCount: number;
  categoryCount: number;
  affiliateLinks: Awaited<ReturnType<typeof loadAffiliateLinks>>;
  siteSettings: SiteSettingsData;
  homePageViews: number;
};

async function loadAffiliateLinks() {
  return prisma.affiliateLink.findMany({
    where: { isActive: true },
    select: { name: true, slug: true, platform: true, commission: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

/** 首頁區塊各自降級；任一 Prisma / GA 相關查詢失敗不白屏 */
export async function loadHomepageData(
  siteLocale: SiteLocale
): Promise<HomepageData> {
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
    safeQuery("homepage.featuredPosts", loadFeaturedPosts, EMPTY_POSTS),
    safeQuery("homepage.heroSlides", () => getHeroSlidesForHomepage(siteLocale), []),
    safeQuery(
      "homepage.carousel",
      () => getHomeCarouselForHomepage(siteLocale),
      []
    ),
    safeQuery(
      "homepage.postCount",
      () =>
        prisma.post.count({
          where: { status: "PUBLISHED", deletedAt: null },
        }),
      0
    ),
    safeQuery(
      "homepage.categoryCount",
      () => prisma.category.count({ where: { deletedAt: null } }),
      0
    ),
    safeQuery("homepage.affiliateLinks", loadAffiliateLinks, []),
    getSafeSiteSettings(),
    safeQuery(
      "homepage.pageViews",
      () =>
        prisma.pageView.count({
          where: { postId: null, locale: siteLocale },
        }),
      0
    ),
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
