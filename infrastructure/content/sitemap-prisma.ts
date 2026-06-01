import type { SitemapPostEntry } from "@/lib/sitemap/load-sitemap-posts";
import { mergePrismaPublishedWhere } from "@/lib/blog/public-post-visibility";

const SITEMAP_POST_LIMIT = 5000;
const PRISMA_BATCH = 500;

export async function loadSitemapPostsPrisma(): Promise<SitemapPostEntry[]> {
  const { prisma } = await import("@/infrastructure/db/prisma");
  const out: SitemapPostEntry[] = [];

  for (let skip = 0; skip < SITEMAP_POST_LIMIT; skip += PRISMA_BATCH) {
    const take = Math.min(PRISMA_BATCH, SITEMAP_POST_LIMIT - skip);
    const rows = await prisma.post.findMany({
      where: mergePrismaPublishedWhere({}),
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
