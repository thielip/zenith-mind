import { cache } from "react";
import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import { safeQuery } from "@/lib/db/safe-query";
import { isDatabaseAvailable } from "@/lib/build/runtime-env";
import { logBlogRenderError } from "@/lib/blog/log-blog-render-error";
import type {
  BlogPostDetail,
  RecommendedPostCard,
} from "@/lib/blog/blog-post-types";

export type { BlogPostDetail, BlogPostFaq, RecommendedPostCard } from "@/lib/blog/blog-post-types";

/** CF 公開站僅 Supabase REST，不載入 Prisma（避免 Worker CPU / bundle 問題） */
async function loadBlogPostBySlugCf(slug: string): Promise<BlogPostDetail | null> {
  const { fetchBlogPostBySlugViaSupabase } = await import(
    "@/lib/blog/public-blog-post-supabase"
  );
  return fetchBlogPostBySlugViaSupabase(slug);
}

export const loadBlogPostBySlug = cache(async (slug: string): Promise<BlogPostDetail | null> => {
  try {
    if (isCfPublicRuntime()) {
      return await safeQuery(`blog.post.${slug}`, () => loadBlogPostBySlugCf(slug), null);
    }

    const { prisma } = await import("@/infrastructure/db/prisma");
    const { loadBlogPostBySlugPrisma } = await import(
      "@/lib/blog/load-blog-post-data-prisma"
    );
    return await loadBlogPostBySlugPrisma(prisma, slug);
  } catch (error) {
    logBlogRenderError("loadBlogPostBySlug", error, {
      slug,
      cfRuntime: isCfPublicRuntime(),
    });
    throw error;
  }
});

export async function loadRecommendedPosts(
  currentPostId: string,
  categoryId: string | undefined,
  locale: string
): Promise<RecommendedPostCard[]> {
  void locale;

  if (isCfPublicRuntime()) {
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
  }

  const { prisma } = await import("@/infrastructure/db/prisma");
  const { loadRecommendedPostsPrisma } = await import(
    "@/lib/blog/load-blog-post-data-prisma"
  );
  return loadRecommendedPostsPrisma(prisma, currentPostId, categoryId);
}

export async function loadPublishedPostSlugsForStaticParams(
  limit = 100
): Promise<string[]> {
  if (isCfPublicRuntime()) {
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
  }

  if (!isDatabaseAvailable()) return [];

  const { prisma } = await import("@/infrastructure/db/prisma");
  const { loadPublishedPostSlugsPrisma } = await import(
    "@/lib/blog/load-blog-post-data-prisma"
  );
  return loadPublishedPostSlugsPrisma(prisma, limit);
}
