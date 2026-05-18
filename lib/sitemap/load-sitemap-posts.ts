import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import { safeQuery } from "@/lib/db/safe-query";
import { isDatabaseAvailable } from "@/lib/build/runtime-env";

export type SitemapPostEntry = {
  slug: string;
  updatedAt: Date;
};

const SITEMAP_POST_LIMIT = 5000;
const PRISMA_BATCH = 500;

async function loadSitemapPostsPrisma(): Promise<SitemapPostEntry[]> {
  const { prisma } = await import("@/infrastructure/db/prisma");
  const out: SitemapPostEntry[] = [];

  for (let skip = 0; skip < SITEMAP_POST_LIMIT; skip += PRISMA_BATCH) {
    const take = Math.min(PRISMA_BATCH, SITEMAP_POST_LIMIT - skip);
    const rows = await prisma.post.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    });
    if (rows.length === 0) break;
    out.push(...rows);
    if (rows.length < take) break;
  }

  return out;
}

export async function loadSitemapPosts(): Promise<SitemapPostEntry[]> {
  if (isCfPublicRuntime()) {
    return safeQuery(
      "sitemap.posts",
      async () => {
        const { fetchSitemapPostsViaSupabase } = await import(
          "@/lib/blog/public-blog-post-supabase"
        );
        return fetchSitemapPostsViaSupabase(SITEMAP_POST_LIMIT);
      },
      []
    );
  }

  if (!isDatabaseAvailable()) return [];

  return safeQuery("sitemap.posts", () => loadSitemapPostsPrisma(), []);
}
