/**
 * 從 GCP 下載的服務帳號 JSON 更新 .env.local（修正 Invalid JWT Signature）
 * 用法：node scripts/import-ga4-key-from-json.mjs "C:\path\to\ga4-api-reader-xxxxx.json"
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const jsonPath = process.argv[2];
if (!jsonPath || !existsSync(jsonPath)) {
  console.error("用法: node scripts/import-ga4-key-from-json.mjs <服務帳號.json>");
  process.exit(1);
}

const { client_email, private_key } = JSON.parse(readFileSync(jsonPath, "utf8"));
if (!client_email || !private_key) {
  console.error("JSON 缺少 client_email 或 private_key");
  process.exit(1);
}

const envPath = ".env.local";
if (!existsSync(envPath)) {
  console.error("找不到 .env.local");
  process.exit(1);
}

const escaped = private_key.replace(/\n/g, "\\n");
let content = readFileSync(envPath, "utf8");

function setKey(name, value) {
  const line = `${name}=${value.includes(" ") || value.includes("\\n") ? `"${value}"` : value}`;
  const re = new RegExp(`^${name}=.*(?:\\n(?!\\w+=).*)*`, "m");
  if (re.test(content)) content = content.replace(re, line);
  else content = content.trimEnd() + `\n${line}\n`;
}

setKey("GA4_CLIENT_EMAIL", client_email);
setKey("GA4_PRIVATE_KEY", escaped);
if (!/GA4_PROPERTY_ID=536903218/.test(content)) {
  setKey("GA4_PROPERTY_ID", "536903218");
}

writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`);

const { createPrivateKey } = await import("node:crypto");
try {
  createPrivateKey(private_key);
} catch (e) {
  console.error("匯入後私鑰仍無法解析:", e instanceof Error ? e.message : e);
  process.exit(1);
}

console.log("已更新 .env.local：", client_email);
console.log("請執行：");
console.log("  node scripts/sync-ga4-env.mjs");
console.log("  npm run ga4:sync-vercel");
console.log("  npx tsx --env-file=.env.local scripts/ga4-diagnose.mjs");
