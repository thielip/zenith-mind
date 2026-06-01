import type { BlogListData, BlogListFilters } from "@/lib/blog/blog-list-types";
import type {
  BlogPostDetail,
  RecommendedPostCard,
} from "@/lib/blog/blog-post-types";
import type {
  AffiliateLinkHomeItem,
  FeaturedPostItem,
} from "@/lib/homepage/homepage-types";
import type { AdSlotPublic } from "@/lib/site/ad-slots";
import type {
  HeroSlideData,
  HomeCarouselItemData,
  SiteLocale,
  SiteSettingsData,
} from "@/lib/site/types";
import type { SitemapPostEntry } from "@/lib/sitemap/load-sitemap-posts";
import type { PublicContentRepository } from "@/domain/content/ports";

export type BlogPostLoadResult =
  | { status: "found"; post: BlogPostDetail }
  | { status: "missing" }
  | { status: "unavailable" };

/** 公開站唯讀資料平面（CF→Supabase、Vercel→Prisma 由 infrastructure 實作） */
export interface PublicReadRepository extends PublicContentRepository {
  loadBlogPostWithStatus(slug: string): Promise<BlogPostLoadResult>;
  loadRecommendedPosts(
    currentPostId: string,
    categoryId: string | undefined,
    locale: string
  ): Promise<RecommendedPostCard[]>;
  loadBlogListData(
    filters: BlogListFilters,
    skip: number,
    perPage: number
  ): Promise<BlogListData>;
  loadPublishedPostSlugs(limit: number): Promise<string[]>;
  loadSitemapPosts(): Promise<SitemapPostEntry[]>;

  loadFeaturedPosts(): Promise<FeaturedPostItem[]>;
  loadAffiliateLinksForHome(): Promise<AffiliateLinkHomeItem[]>;
  countPublishedPosts(): Promise<number>;
  countCategories(): Promise<number>;
  countHomePageViews(siteLocale: SiteLocale): Promise<number>;

  getSiteSettings(): Promise<SiteSettingsData>;
  getHeroSlides(
    locale: SiteLocale,
    includeInactive?: boolean
  ): Promise<HeroSlideData[]>;
  getHomeCarouselItems(
    locale: SiteLocale,
    includeInactive?: boolean
  ): Promise<HomeCarouselItemData[]>;
  getActiveAdSlot(
    slotKey: string,
    locale: SiteLocale
  ): Promise<AdSlotPublic | null>;
}
