/**
 * 將 GSC_OAUTH_* 與 GOOGLE_ADS_* 對齊（寫入 .env.local，不輸出 secret）
 * npx tsx --env-file=.env.local scripts/align-gsc-oauth-env.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

config({ path: envPath });

const PAIRS = [
  ["GSC_OAUTH_CLIENT_ID", "GOOGLE_ADS_CLIENT_ID"],
  ["GSC_OAUTH_CLIENT_SECRET", "GOOGLE_ADS_CLIENT_SECRET"],
  ["GSC_OAUTH_REFRESH_TOKEN", "GOOGLE_ADS_REFRESH_TOKEN"],
];

let content = readFileSync(envPath, "utf8");
let changed = 0;

for (const [gscKey, adsKey] of PAIRS) {
  const adsVal = process.env[adsKey]?.trim();
  if (!adsVal) {
    console.error(`缺少 ${adsKey}，無法對齊 ${gscKey}`);
    process.exit(1);
  }
  const gscVal = process.env[gscKey]?.trim();
  if (gscVal === adsVal) {
    console.log(`OK ${gscKey}（已與 ${adsKey} 一致）`);
    continue;
  }
  const re = new RegExp(`^${gscKey}=.*$`, "m");
  if (re.test(content)) {
    content = content.replace(re, `${gscKey}=${adsVal}`);
  } else {
    content += `\n${gscKey}=${adsVal}\n`;
  }
  changed++;
  console.log(`更新 ${gscKey} ← ${adsKey}`);
}

if (changed > 0) {
  writeFileSync(envPath, content, "utf8");
  console.log(`已寫入 ${envPath}（${changed} 項）`);
} else {
  console.log("無需變更 .env.local");
}
