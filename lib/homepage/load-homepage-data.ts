import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import { safeQuery } from "@/lib/db/safe-query";
import {
  getHeroSlidesForHomepage,
  getHomeCarouselForHomepage,
} from "@/lib/site/homepage-data-cache";
import { getSafeSiteSettings } from "@/lib/site/safe-site-settings";
import {
  countCategoriesViaSupabase,
  countHomePageViewsViaSupabase,
  countPublishedPostsViaSupabase,
  fetchAffiliateLinksViaSupabase,
  fetchFeaturedPostsViaSupabase,
} from "@/lib/site/public-site-supabase";
import type { HomePostCard } from "@/components/home/FeaturedPostsSection";
import type { SiteLocale, SiteSettingsData } from "@/lib/site/types";

export type FeaturedPostItem = HomePostCard;

export type AffiliateLinkItem = {
  name: string;
  slug: string;
  platform: string | null;
  commission: string | null;
};

const EMPTY_POSTS: FeaturedPostItem[] = [];
const EMPTY_AFFILIATES: AffiliateLinkItem[] = [];

async function loadFeaturedPostsPrisma(): Promise<FeaturedPostItem[]> {
  const { prisma } = await import("@/infrastructure/db/prisma");
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

async function loadAffiliateLinksPrisma(): Promise<AffiliateLinkItem[]> {
  const { prisma } = await import("@/infrastructure/db/prisma");
  return prisma.affiliateLink.findMany({
    where: { isActive: true },
    select: { name: true, slug: true, platform: true, commission: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

async function loadFeaturedPosts(): Promise<FeaturedPostItem[]> {
  if (isCfPublicRuntime()) return fetchFeaturedPostsViaSupabase();
  return loadFeaturedPostsPrisma();
}

async function loadAffiliateLinks(): Promise<AffiliateLinkItem[]> {
  if (isCfPublicRuntime()) return fetchAffiliateLinksViaSupabase();
  return loadAffiliateLinksPrisma();
}

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

/** 首頁區塊各自降級；CF Worker 不載入 Prisma */
export async function loadHomepageData(
  siteLocale: SiteLocale
): Promise<HomepageData> {
  const loadPostCount = async () => {
    if (isCfPublicRuntime()) return countPublishedPostsViaSupabase();
    const { prisma } = await import("@/infrastructure/db/prisma");
    return prisma.post.count({
      where: { status: "PUBLISHED", deletedAt: null },
    });
  };

  const loadCategoryCount = async () => {
    if (isCfPublicRuntime()) return countCategoriesViaSupabase();
    const { prisma } = await import("@/infrastructure/db/prisma");
    return prisma.category.count({ where: { deletedAt: null } });
  };

  const loadPageViews = async () => {
    if (isCfPublicRuntime()) return countHomePageViewsViaSupabase(siteLocale);
    const { prisma } = await import("@/infrastructure/db/prisma");
    return prisma.pageView.count({
      where: { postId: null, locale: siteLocale },
    });
  };

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
    safeQuery("homepage.postCount", loadPostCount, 0),
    safeQuery("homepage.categoryCount", loadCategoryCount, 0),
    safeQuery("homepage.affiliateLinks", loadAffiliateLinks, EMPTY_AFFILIATES),
    getSafeSiteSettings(),
    safeQuery("homepage.pageViews", loadPageViews, 0),
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
