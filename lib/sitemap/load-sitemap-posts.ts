import { safeQuery } from "@/lib/db/safe-query";

export type SitemapPostEntry = {
  slug: string;
  updatedAt: Date;
};

export const SITEMAP_POST_LIMIT = 5000;

export async function loadSitemapPosts(): Promise<SitemapPostEntry[]> {
  const { getPublicReadRepository } = await import(
    "@/lib/public-content/get-repository"
  );
  const repo = await getPublicReadRepository();
  return safeQuery("sitemap.posts", () => repo.loadSitemapPosts(), []);
}
