/** 模擬 fetchSiteViewTotalFromSupabase 邏輯，驗證應顯示數字 */
import { existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const locale = "zh-TW";
const h = { apikey: key, Authorization: `Bearer ${key}` };
const todayUtc = new Date().toISOString().slice(0, 10);

const aggsRes = await fetch(
  `${base}/rest/v1/site_daily_aggregates?select=date,views&locale=eq.${locale}`,
  { headers: h }
);
const aggs = await aggsRes.json();
let pastSum = 0;
let todayInAgg = 0;
for (const row of aggs) {
  const d = String(row.date).slice(0, 10);
  const v = Number(row.views) || 0;
  if (d < todayUtc) pastSum += v;
  else if (d === todayUtc) todayInAgg += v;
}

const pvRes = await fetch(
  `${base}/rest/v1/page_views?select=id&postId=is.null&locale=eq.${locale}&createdAt=gte.${todayUtc}T00:00:00Z`,
  { headers: { ...h, Prefer: "count=exact" }, method: "HEAD" }
);
const todayLive = Number(pvRes.headers.get("content-range")?.split("/")[1] ?? 0);

const total = aggs.length > 0 ? pastSum + (todayInAgg > 0 ? todayInAgg : todayLive) : todayLive;
console.log({ pastSum, todayInAgg, todayLive, total, aggDays: aggs.length });
