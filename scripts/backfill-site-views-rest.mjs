/**
 * 不依 RPC：從 page_views 聚合後 upsert site_daily_aggregates（修復 id 缺失前可用）
 */
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const locale = "zh-TW";

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates",
};

async function fetchAllHomeViews() {
  const rows = [];
  let offset = 0;
  const limit = 500;
  while (true) {
    const url = `${base}/rest/v1/page_views?select=createdAt,visitorHash&postId=is.null&locale=eq.${locale}&order=createdAt.asc&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return rows;
}

function dayKey(iso) {
  return iso.slice(0, 10);
}

async function upsertDay(date, views, uniqueVisitors) {
  const body = [
    {
      id: randomUUID(),
      date,
      locale,
      views,
      uniqueVisitors,
    },
  ];
  const res = await fetch(
    `${base}/rest/v1/site_daily_aggregates?on_conflict=date,locale`,
    { method: "POST", headers, body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(`${date}: ${await res.text()}`);
}

const rows = await fetchAllHomeViews();
const byDay = new Map();
for (const r of rows) {
  const d = dayKey(r.createdAt);
  if (!byDay.has(d)) byDay.set(d, { views: 0, hashes: new Set() });
  const b = byDay.get(d);
  b.views++;
  if (r.visitorHash) b.hashes.add(r.visitorHash);
}

console.log(`共 ${rows.length} 筆首頁瀏覽，${byDay.size} 個 UTC 日`);

for (const [date, { views, hashes }] of [...byDay.entries()].sort()) {
  await upsertDay(date, views, hashes.size);
  console.log(`${date}: ${views} views`);
}

const totalsRes = await fetch(
  `${base}/rest/v1/v_site_view_totals?select=locale,view_count&locale=eq.${locale}`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } }
);
console.log("\nv_site_view_totals:", await totalsRes.json());
