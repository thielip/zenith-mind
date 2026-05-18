/** 驗證首頁 CMS 表是否可被 REST 讀取（與本機 Prisma 畫面一致所需） */
import { readFileSync } from "node:fs";

function loadDevVars() {
  const out = {};
  for (const line of readFileSync(".dev.vars", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

const env = loadDevVars();
const base = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Accept: "application/json",
};

const tables = [
  { name: "hero_slides", q: "select=title&locale=eq.zh-TW&isActive=eq.true&limit=3" },
  { name: "site_settings", q: "select=id&limit=1" },
  { name: "home_carousel_items", q: "select=title&locale=eq.zh-TW&limit=3" },
];

for (const { name, q } of tables) {
  const res = await fetch(`${base}/rest/v1/${name}?${q}`, { headers });
  const text = await res.text();
  console.log(`[${name}] ${res.status}`, text.slice(0, 200));
}
