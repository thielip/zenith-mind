// app/sitemap.ts — 動態 sitemap
import type { MetadataRoute } from "next";
import { env } from "@/env";
import { prisma } from "@/infrastructure/db/prisma";

export const revalidate = 3600;
const SITEMAP_POST_LIMIT = 5000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/zh-TW`,       lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/zh-TW/blog`,  lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/zh-TW/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/en`,          lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/en/blog`,     lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/en/about`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const posts = await prisma.post.findMany({
    where:   { status: "PUBLISHED", deletedAt: null },
    select:  { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: SITEMAP_POST_LIMIT,
  });

  const postRoutes: MetadataRoute.Sitemap = posts.flatMap((p) => [
    { url: `${base}/zh-TW/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${base}/en/blog/${p.slug}`,    lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 },
  ]);

  return [...staticRoutes, ...postRoutes];
}
