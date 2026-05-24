/**
 * 從 .env.local 同步 GSC OAuth 至 Vercel Production（不輸出值）
 * npx tsx --env-file=.env.local scripts/sync-vercel-gsc-secrets.mjs
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local" });

const TARGET = process.env["VERCEL_ENV_TARGET"] ?? "production";

const KEYS = [
  "GSC_OAUTH_CLIENT_ID",
  "GSC_OAUTH_CLIENT_SECRET",
  "GSC_OAUTH_REFRESH_TOKEN",
];

function resolve(key) {
  const direct = process.env[key]?.trim();
  if (direct) return direct;
  if (key === "GSC_OAUTH_CLIENT_ID") return process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  if (key === "GSC_OAUTH_CLIENT_SECRET") return process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  if (key === "GSC_OAUTH_REFRESH_TOKEN") return process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim();
  return "";
}

for (const key of KEYS) {
  const val = resolve(key);
  if (!val) {
    console.error(`SKIP ${key}: missing in .env.local`);
    process.exit(1);
  }
  console.log(`Vercel env add ${key} (${TARGET})…`);
  const rm = spawnSync(
    "npx",
    ["vercel", "env", "rm", key, TARGET, "--yes"],
    { stdio: "inherit", shell: true }
  );
  if (rm.status !== 0 && rm.status !== 1) process.exit(rm.status ?? 1);

  const add = spawnSync(
    "npx",
    ["vercel", "env", "add", key, TARGET, "--force"],
    { input: val, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"], shell: true }
  );
  if (add.status !== 0) process.exit(add.status ?? 1);
}

console.log("Done. 請在 Vercel 重新部署 Production（或 vercel deploy --prod）使變數生效。");
