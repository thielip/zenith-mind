/**
 * 一次性：從 .env.import.tmp 讀取並寫入 wrangler secrets（檔案勿提交 Git）
 * 用法：node scripts/push-wrangler-secrets.mjs .env.import.tmp
 */
import { readFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";

const SECRET_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "TOTP_ENCRYPTION_KEY",
  "GEMINI_API_KEY",
  "GA4_PRIVATE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "WEBHOOK_SECRET",
  "CRON_SECRET",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "REVALIDATE_SECRET",
  "REDIRECT_LOOKUP_SECRET",
  "PAGEVIEW_HASH_SALT",
];

function parseEnvFile(content) {
  const out = {};
  let key = null;
  let buf = [];

  const flush = () => {
    if (!key) return;
    let val = buf.join("\n").trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val.replace(/\\n/g, "\n");
    key = null;
    buf = [];
  };

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) {
      flush();
      key = m[1];
      buf = [m[2] ?? ""];
    } else if (key) {
      buf.push(line);
    }
  }
  flush();
  return out;
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/push-wrangler-secrets.mjs <env-file>");
  process.exit(1);
}

const vars = parseEnvFile(readFileSync(file, "utf8"));
let ok = 0;
let fail = 0;

for (const name of SECRET_KEYS) {
  const value = vars[name];
  if (!value) {
    console.warn(`skip (missing): ${name}`);
    continue;
  }
  const r = spawnSync("npx", ["wrangler", "secret", "put", name], {
    input: value,
    stdio: ["pipe", "ignore", "pipe"],
    encoding: "utf8",
  });
  if (r.status === 0) {
    ok++;
    console.log(`ok: ${name}`);
  } else {
    fail++;
    console.error(`fail: ${name}`);
  }
}

console.log(`done: ${ok} ok, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
