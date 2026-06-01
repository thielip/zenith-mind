import type { PublicReadRepository } from "@/domain/content/public-read.port";
import { publicContentSupabaseRepository } from "@/infrastructure/content/public-content-supabase.repository";
import { safeQuery } from "@/lib/db/safe-query";
import {
  countCategoriesViaSupabase,
  countHomePageViewsViaSupabase,
  countPublishedPostsViaSupabase,
  fetchAffiliateLinksViaSupabase,
  fetchFeaturedPostsViaSupabase,
  getActiveAdSlotViaSupabase,
  getHeroSlidesViaSupabase,
  getHomeCarouselItemsViaSupabase,
  getSiteSettingsViaSupabase,
} from "@/lib/site/public-site-supabase";
import { DEFAULT_SITE_SETTINGS } from "@/lib/site/queries";
import type { BlogListData } from "@/lib/blog/blog-list-types";

const EMPTY_BLOG_LIST: BlogListData = {
  posts: [],
  total: 0,
  categories: [],
  tags: [],
};

export const publicReadSupabaseRepository: PublicReadRepository = {
  ...publicContentSupabaseRepository,

  async loadBlogPostWithStatus(slug) {
    const { fetchBlogPostBySlugViaSupabase, probePublishedPostSlugExists } =
      await import("@/lib/blog/public-blog-post-supabase");
    const post = await fetchBlogPostBySlugViaSupabase(slug);
    if (post) return { status: "found", post };
    const exists = await probePublishedPostSlugExists(slug);
    return exists ? { status: "unavailable" } : { status: "missing" };
  },

  async loadRecommendedPosts(currentPostId, categoryId, locale) {
    void locale;
    return safeQuery(
      "blog.recommended",
      async () => {
        const { fetchRecommendedPostsViaSupabase } = await import(
          "@/lib/blog/public-blog-post-supabase"
        );
        const posts = await fetchRecommendedPostsViaSupabase(
          currentPostId,
          categoryId
        );
        if (posts.length > 0) return posts;

        const { getPrismaCfEdge } = await import("@/lib/db/prisma-cf-edge");
        const prisma = getPrismaCfEdge();
        if (!prisma) return [];
        const { loadRecommendedPostsPrisma } = await import(
          "@/lib/blog/load-blog-post-data-prisma"
        );
        return loadRecommendedPostsPrisma(prisma, currentPostId, categoryId);
      },
      []
    );
  },

  async loadBlogListData(filters, skip, perPage) {
    return safeQuery(
      "blog.list",
      async () => {
        const { loadBlogListDataViaSupabase } = await import(
          "@/lib/blog/public-blog-supabase"
        );
        try {
          return await loadBlogListDataViaSupabase(filters, skip, perPage);
        } catch (supabaseError) {
          console.error(
            "[blog.list] Supabase REST failed, trying Prisma Neon",
            supabaseError
          );
        }

        const { getPrismaCfEdge } = await import("@/lib/db/prisma-cf-edge");
        const prisma = getPrismaCfEdge();
        if (!prisma) throw new Error("Prisma Edge is not configured (DATABASE_URL)");

        const { loadBlogListDataWithPrisma } = await import(
          "@/lib/blog/load-blog-list-data-prisma"
        );
        return loadBlogListDataWithPrisma(prisma, filters, skip, perPage);
      },
      EMPTY_BLOG_LIST
    );
  },

  async loadPublishedPostSlugs(limit) {
    return safeQuery(
      "blog.staticSlugs",
      async () => {
        const { fetchPublishedPostSlugsViaSupabase } = await import(
          "@/lib/blog/public-blog-post-supabase"
        );
        return fetchPublishedPostSlugsViaSupabase(limit);
      },
      []
    );
  },

  async loadSitemapPosts() {
    return safeQuery(
      "sitemap.posts",
      async () => {
        const { fetchSitemapPostsViaSupabase } = await import(
          "@/lib/blog/public-blog-post-supabase"
        );
        const { SITEMAP_POST_LIMIT } = await import("@/lib/sitemap/load-sitemap-posts");
        return fetchSitemapPostsViaSupabase(SITEMAP_POST_LIMIT);
      },
      []
    );
  },

  loadFeaturedPosts: fetchFeaturedPostsViaSupabase,
  loadAffiliateLinksForHome: fetchAffiliateLinksViaSupabase,
  countPublishedPosts: countPublishedPostsViaSupabase,
  countCategories: countCategoriesViaSupabase,
  countHomePageViews: countHomePageViewsViaSupabase,

  async getSiteSettings() {
    try {
      return await getSiteSettingsViaSupabase();
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  },

  getHeroSlides: getHeroSlidesViaSupabase,
  getHomeCarouselItems: getHomeCarouselItemsViaSupabase,

  async getActiveAdSlot(slotKey, locale) {
    try {
      return await getActiveAdSlotViaSupabase(slotKey, locale);
    } catch {
      return null;
    }
  },
};
