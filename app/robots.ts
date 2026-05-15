// app/robots.ts — 動態 robots（禁止使用靜態 robots.txt）
import type { MetadataRoute } from "next";
import { env } from "@/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL;
  const isVercelPreview = process.env["VERCEL_ENV"] === "preview";

  // 預覽網址不應被索引（編輯／審核用）
  if (isVercelPreview) {
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
