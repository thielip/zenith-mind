/**
 * 從 .env.local 同步 GA4 服務帳號至 Vercel Production（不輸出值）
 * npx tsx --env-file=.env.local scripts/sync-vercel-ga4-key.mjs
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { validateServiceAccountPrivateKey } from "../lib/google/normalize-private-key.ts";

config({ path: ".env.local" });

const TARGET = process.env["VERCEL_ENV_TARGET"] ?? "production";

const KEYS = ["GA4_CLIENT_EMAIL", "GA4_PRIVATE_KEY"];

const pkRaw = process.env.GA4_PRIVATE_KEY?.trim();
if (pkRaw) {
  const check = validateServiceAccountPrivateKey(pkRaw);
  if (!check.ok) {
    console.error("GA4_PRIVATE_KEY 在本機即無法解析:", check.error);
    console.error("請先：node scripts/import-ga4-key-from-json.mjs <服務帳號.json>");
    process.exit(1);
  }
}

for (const key of KEYS) {
  const val = process.env[key]?.trim();
  if (!val) {
    console.error(`SKIP ${key}: missing in .env.local`);
    process.exit(1);
  }
  console.log(`Vercel env add ${key} (${TARGET})…`);
  spawnSync("npx", ["vercel", "env", "rm", key, TARGET, "--yes"], {
    stdio: "inherit",
    shell: true,
  });
  const add = spawnSync(
    "npx",
    ["vercel", "env", "add", key, TARGET, "--force"],
    { input: val, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"], shell: true }
  );
  if (add.status !== 0) process.exit(add.status ?? 1);
}

console.log("Done. 請 vercel deploy --prod 使新私鑰生效。");
