import type { PublicReadRepository } from "@/domain/content/public-read.port";
import { publicContentPrismaRepository } from "@/infrastructure/content/public-content-prisma.repository";
import { isDatabaseAvailable } from "@/lib/build/runtime-env";
import { prismaPublishedPostWhere } from "@/lib/blog/public-post-visibility";
import {
  cachePublicRead,
  PUBLIC_READ_CACHE_TAGS,
} from "@/lib/public-content/cache-tags";
import type { FeaturedPostItem } from "@/lib/homepage/homepage-types";

async function loadFeaturedPostsPrisma(): Promise<FeaturedPostItem[]> {
  const { prisma } = await import("@/infrastructure/db/prisma");
  return prisma.post.findMany({
    where: prismaPublishedPostWhere(),
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

export const publicReadPrismaRepository: PublicReadRepository = {
  ...publicContentPrismaRepository,

  searchPublishedPosts(query, locale) {
    return cachePublicRead(
      ["public-search", query, locale],
      PUBLIC_READ_CACHE_TAGS.posts,
      () => publicContentPrismaRepository.searchPublishedPosts(query, locale)
    );
  },

  async loadBlogPostWithStatus(slug) {
    return cachePublicRead(
      ["blog-post-status", slug],
      PUBLIC_READ_CACHE_TAGS.posts,
      async () => {
        const { prisma } = await import("@/infrastructure/db/prisma");
        const { loadBlogPostBySlugPrisma } = await import(
          "@/lib/blog/load-blog-post-data-prisma"
        );
        const post = await loadBlogPostBySlugPrisma(prisma, slug);
        return post ? { status: "found", post } : { status: "missing" };
      }
    );
  },

  loadRecommendedPosts(currentPostId, categoryId, locale) {
    return cachePublicRead(
      ["blog-recommended", currentPostId, categoryId ?? "", locale],
      PUBLIC_READ_CACHE_TAGS.posts,
      async () => {
        const { prisma } = await import("@/infrastructure/db/prisma");
        const { loadRecommendedPostsPrisma } = await import(
          "@/lib/blog/load-blog-post-data-prisma"
        );
        return loadRecommendedPostsPrisma(prisma, currentPostId, categoryId);
      }
    );
  },

  loadBlogListData(filters, skip, perPage) {
    return cachePublicRead(
      ["blog-list", JSON.stringify({ filters, skip, perPage })],
      PUBLIC_READ_CACHE_TAGS.posts,
      async () => {
        const { loadBlogListDataPrisma } = await import(
          "@/lib/blog/load-blog-list-data-prisma"
        );
        return loadBlogListDataPrisma(filters, skip, perPage);
      }
    );
  },

  loadPublishedPostSlugs(limit) {
    return cachePublicRead(
      ["blog-slugs", String(limit)],
      PUBLIC_READ_CACHE_TAGS.posts,
      async () => {
        if (!isDatabaseAvailable()) return [];
        const { prisma } = await import("@/infrastructure/db/prisma");
        const { loadPublishedPostSlugsPrisma } = await import(
          "@/lib/blog/load-blog-post-data-prisma"
        );
        return loadPublishedPostSlugsPrisma(prisma, limit);
      }
    );
  },

  loadSitemapPosts() {
    return cachePublicRead(
      ["sitemap-posts"],
      PUBLIC_READ_CACHE_TAGS.sitemap,
      async () => {
        const { loadSitemapPostsPrisma } = await import(
          "@/infrastructure/content/sitemap-prisma"
        );
        return loadSitemapPostsPrisma();
      }
    );
  },

  loadFeaturedPosts() {
    return cachePublicRead(
      ["homepage-featured"],
      PUBLIC_READ_CACHE_TAGS.posts,
      loadFeaturedPostsPrisma
    );
  },

  loadAffiliateLinksForHome() {
    return cachePublicRead(
      ["homepage-affiliates"],
      PUBLIC_READ_CACHE_TAGS.affiliates,
      async () => {
        const { prisma } = await import("@/infrastructure/db/prisma");
        return prisma.affiliateLink.findMany({
          where: { isActive: true },
          select: { name: true, slug: true, platform: true, commission: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        });
      }
    );
  },

  countPublishedPosts() {
    return cachePublicRead(
      ["count-published-posts"],
      PUBLIC_READ_CACHE_TAGS.posts,
      async () => {
        const { prisma } = await import("@/infrastructure/db/prisma");
        return prisma.post.count({ where: prismaPublishedPostWhere() });
      }
    );
  },

  countCategories() {
    return cachePublicRead(
      ["count-categories"],
      PUBLIC_READ_CACHE_TAGS.posts,
      async () => {
        const { prisma } = await import("@/infrastructure/db/prisma");
        return prisma.category.count({ where: { deletedAt: null } });
      }
    );
  },

  countHomePageViews(siteLocale) {
    return cachePublicRead(
      ["homepage-views", siteLocale],
      ["page-view-stats", "homepage-stats"],
      async () => {
        const { fetchSiteViewTotal } = await import("@/lib/analytics/post-view-totals");
        return fetchSiteViewTotal(siteLocale);
      },
      60
    );
  },

  async getSiteSettings() {
    const { getCachedSiteSettings } = await import("@/lib/site/site-settings-cache");
    return getCachedSiteSettings();
  },

  getHeroSlides(locale, includeInactive = false) {
    return cachePublicRead(
      ["hero-slides", locale, String(includeInactive)],
      PUBLIC_READ_CACHE_TAGS.heroSlides,
      async () => {
        const { getHeroSlidesPrisma } = await import(
          "@/lib/site/hero-carousel-queries-prisma"
        );
        return getHeroSlidesPrisma(locale, includeInactive);
      }
    );
  },

  getHomeCarouselItems(locale, includeInactive = false) {
    return cachePublicRead(
      ["home-carousel", locale, String(includeInactive)],
      PUBLIC_READ_CACHE_TAGS.homeCarousel,
      async () => {
        const { getHomeCarouselItemsPrisma } = await import(
          "@/lib/site/hero-carousel-queries-prisma"
        );
        return getHomeCarouselItemsPrisma(locale, includeInactive);
      }
    );
  },

  getActiveAdSlot(slotKey, locale) {
    return cachePublicRead(
      ["ad-slot", slotKey, locale],
      PUBLIC_READ_CACHE_TAGS.posts,
      async () => {
        const { getActiveAdSlotPrisma } = await import("@/lib/site/ad-slots-prisma");
        return getActiveAdSlotPrisma(slotKey, locale);
      }
    );
  },
};
