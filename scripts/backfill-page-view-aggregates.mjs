/**
 * 回填 site_daily_aggregates / daily_aggregates（呼叫 Supabase RPC）
 * 用法：npx tsx --env-file=.env.local scripts/backfill-page-view-aggregates.mjs [days]
 */
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const days = Math.min(Number(process.argv[2] || 60), 365);
const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!base || !key) {
  console.error("需要 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function rpcRefresh(dayIso) {
  const res = await fetch(`${base}/rest/v1/rpc/refresh_page_view_daily_aggregates`, {
    method: "POST",
    headers,
    body: JSON.stringify({ p_day: dayIso }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${dayIso}: ${res.status} ${text.slice(0, 200)}`);
  }
}

async function fetchTotals() {
  const res = await fetch(
    `${base}/rest/v1/v_site_view_totals?select=locale,view_count&locale=eq.zh-TW`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  return res.json();
}

console.log(`回填最近 ${days} 天…`);
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

let ok = 0;
let fail = 0;
for (let i = days; i >= 1; i--) {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - i);
  const dayIso = d.toISOString().slice(0, 10);
  try {
    await rpcRefresh(dayIso);
    ok++;
    if (ok % 10 === 0) process.stdout.write(".");
  } catch (e) {
    fail++;
    console.error("\n", e.message);
  }
}

console.log(`\n完成：${ok} 天成功，${fail} 天失敗`);
const totals = await fetchTotals();
console.log("v_site_view_totals (zh-TW):", totals);
