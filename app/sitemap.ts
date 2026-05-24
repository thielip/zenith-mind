// app/sitemap.ts — 動態 sitemap
import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site/url";
import { loadSitemapPosts } from "@/lib/sitemap/load-sitemap-posts";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/zh-TW`,       lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/zh-TW/blog`,  lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/zh-TW/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms-of-service`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/en`,          lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${base}/en/blog`,     lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/en/about`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const posts = await loadSitemapPosts();

  const postRoutes: MetadataRoute.Sitemap = posts.flatMap((p) => [
    {
      url: `${base}/zh-TW/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${base}/en/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ]);

  return [...staticRoutes, ...postRoutes];
}
