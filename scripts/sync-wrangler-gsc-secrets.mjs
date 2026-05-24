/**
 * 從 .env.local 同步 GSC OAuth secrets 至 Cloudflare Worker
 * npx tsx --env-file=.env.local scripts/sync-wrangler-gsc-secrets.mjs
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local" });

const KEYS = [
  "GSC_OAUTH_CLIENT_ID",
  "GSC_OAUTH_CLIENT_SECRET",
  "GSC_OAUTH_REFRESH_TOKEN",
];

for (const key of KEYS) {
  const val =
    process.env[key]?.trim() ||
    (key === "GSC_OAUTH_CLIENT_ID"
      ? process.env.GOOGLE_ADS_CLIENT_ID?.trim()
      : key === "GSC_OAUTH_CLIENT_SECRET"
        ? process.env.GOOGLE_ADS_CLIENT_SECRET?.trim()
        : process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim());
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
