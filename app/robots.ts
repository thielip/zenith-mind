// app/robots.ts — 動態 robots（禁止使用靜態 robots.txt）
import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site/url";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl();
  const isVercelPreview = process.env["VERCEL_ENV"] === "preview";
  const onVercelProduction =
    process.env["VERCEL_ENV"] === "production" && Boolean(process.env["VERCEL"]);

  // 預覽網址、Vercel 預設網域：不應被索引（正式權重集中在 www）
  if (isVercelPreview || onVercelProduction) {
    return {
      rules: [{ userAgent: "*", disallow: ["/"] }],
      sitemap: `${base}/sitemap.xml`,
    };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    // ⚠ 禁止將 /admin/ 寫入 disallow（等同公告攻擊目標）
    sitemap: `${base}/sitemap.xml`,
  };
}
