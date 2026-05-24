/**
 * 從 .env.local 同步 Google Ads secrets 至 Cloudflare Worker（不輸出值）
 * npx tsx --env-file=.env.local scripts/sync-wrangler-google-ads-secrets.mjs
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local" });

const KEYS = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
];

for (const key of KEYS) {
  const val = process.env[key]?.trim();
  if (!val) {
    console.error(`SKIP ${key}: missing in .env.local`);
    process.exit(1);
  }
  console.log(`Putting ${key}…`);
  const r = spawnSync("npx", ["wrangler", "secret", "put", key], {
    input: val,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log("Done.");
