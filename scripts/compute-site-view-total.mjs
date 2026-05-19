/**
 * 首頁累計瀏覽 = page_views 筆數（postId is null）
 * npx tsx --env-file=.env.local scripts/compute-site-view-total.mjs
 */
import { existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const locale = "zh-TW";
const h = { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" };

const res = await fetch(
  `${base}/rest/v1/page_views?select=id&postId=is.null&locale=eq.${locale}`,
  { method: "HEAD", headers: h }
);
const total = Number(res.headers.get("content-range")?.split("/")[1] ?? 0);
console.log({ locale, total, status: res.status });
