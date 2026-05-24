/**
 * 從 .env.local 同步 GA4 服務帳號至 Cloudflare Worker（不輸出值）
 * npx tsx --env-file=.env.local scripts/sync-wrangler-ga4-key.mjs
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { validateServiceAccountPrivateKey } from "../lib/google/normalize-private-key.ts";

config({ path: ".env.local" });

/** GA4_CLIENT_EMAIL 若在 wrangler.toml [vars] 已綁定，只能更新 GA4_PRIVATE_KEY secret */
const KEYS = ["GA4_PRIVATE_KEY"];

const pkRaw = process.env.GA4_PRIVATE_KEY?.trim();
if (pkRaw) {
  const check = validateServiceAccountPrivateKey(pkRaw);
  if (!check.ok) {
    console.error("GA4_PRIVATE_KEY 無法解析:", check.error);
    process.exit(1);
  }
}

for (const key of KEYS) {
  const val = process.env[key]?.trim();
  if (!val) {
    console.error(`SKIP ${key}: missing`);
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
