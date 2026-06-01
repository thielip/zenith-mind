import { cache } from "react";
import { safeQuery } from "@/lib/db/safe-query";
import { isDatabaseAvailable } from "@/lib/build/runtime-env";
import { logBlogRenderError } from "@/lib/blog/log-blog-render-error";
import { getPublicReadRepository } from "@/lib/public-content/get-repository";
import { isPublicCfBackend } from "@/lib/public-content/runtime";
import type {
  BlogPostDetail,
  RecommendedPostCard,
} from "@/lib/blog/blog-post-types";

export type { BlogPostDetail, BlogPostFaq, RecommendedPostCard } from "@/lib/blog/blog-post-types";
export type { BlogPostLoadResult } from "@/domain/content/public-read.port";

export const loadBlogPostBySlug = cache(async (slug: string): Promise<BlogPostDetail | null> => {
  const result = await loadBlogPostWithStatus(slug);
  return result.status === "found" ? result.post : null;
});

export const loadBlogPostWithStatus = cache(async (slug: string) => {
  try {
    const repo = await getPublicReadRepository();
    return repo.loadBlogPostWithStatus(slug);
  } catch (error) {
    logBlogRenderError("loadBlogPostWithStatus", error, {
      slug,
      cfRuntime: isPublicCfBackend(),
    });
    return { status: "unavailable" as const };
  }
});

export async function loadRecommendedPosts(
  currentPostId: string,
  categoryId: string | undefined,
  locale: string
): Promise<RecommendedPostCard[]> {
  const repo = await getPublicReadRepository();
  return repo.loadRecommendedPosts(currentPostId, categoryId, locale);
}

export async function loadPublishedPostSlugsForStaticParams(
  limit = 100
): Promise<string[]> {
  if (!isPublicCfBackend() && !isDatabaseAvailable()) return [];
  const repo = await getPublicReadRepository();
  return safeQuery("blog.staticSlugs", () => repo.loadPublishedPostSlugs(limit), []);
}
