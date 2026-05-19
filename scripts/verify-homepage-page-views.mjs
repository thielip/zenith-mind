/**
 * 驗證首頁累計瀏覽（Supabase page_views + v_site_view_totals）
 * npx tsx --env-file=.env.local scripts/verify-homepage-page-views.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });

const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!base || !key) {
  console.error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Accept: "application/json",
};

async function rest(table, params = "") {
  const url = `${base}/rest/v1/${table}?${params}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${table} ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : [];
}

let totals = [];
try {
  totals = await rest(
    "v_site_view_totals",
    "select=locale,view_count&locale=eq.zh-TW&limit=1"
  );
} catch {
  totals = await rest("v_site_view_totals", "select=*&locale=eq.zh-TW&limit=1");
}
const todayRows = await rest(
  "page_views",
  "select=id,locale,createdAt&postId=is.null&locale=eq.zh-TW&order=createdAt.desc&limit=5"
);
const todayCountRes = await fetch(
  `${base}/rest/v1/page_views?postId=is.null&locale=eq.zh-TW&select=id`,
  { method: "HEAD", headers: { ...headers, Prefer: "count=exact" } }
);
const range = todayCountRes.headers.get("content-range") ?? "";
const todayTotal = parseInt(range.split("/")[1] ?? "0", 10);

console.log("── v_site_view_totals (zh-TW) ──");
const row = totals[0] ?? {};
const displayCount = row.view_count ?? row.total_views ?? 0;
console.log({ ...row, displayCount });
console.log("── 最近 5 筆首頁 page_views ──");
console.log(todayRows);
console.log("── 首頁 page_views 總列數（HEAD count）──");
console.log(todayTotal);
console.log(
  "\n若 view_count 與前台「累計瀏覽」接近，且 POST /api/public/page-view 回 ok，則功能正常。"
);
