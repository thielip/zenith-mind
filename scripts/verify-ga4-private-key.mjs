/**
 * 檢查 GA4_PRIVATE_KEY 是否可被 Node/OpenSSL 解析（不輸出私鑰）
 * npx tsx --env-file=.env.local scripts/verify-ga4-private-key.mjs
 */
import { config } from "dotenv";
import { createPrivateKey } from "node:crypto";

config({ path: ".env.local" });

const raw = process.env.GA4_PRIVATE_KEY?.trim() ?? "";
if (!raw) {
  console.error("缺少 GA4_PRIVATE_KEY");
  process.exit(1);
}

let key = raw.replace(/\\n/g, "\n");
const block = key.match(/-----BEGIN ([^-]+)-----([\s\S]*?)-----END \1-----/);
if (!block) {
  console.error("非 PEM 格式");
  process.exit(1);
}

const b64 = block[2].replace(/\s/g, "");
const mod = b64.length % 4;
console.log("PEM 類型:", block[1]);
console.log("Base64 長度:", b64.length, "（%4 應為 0，目前", mod, "）");

if (mod !== 0) {
  console.error(
    "\n私鑰 Base64 已損壞（長度不是 4 的倍數），無法修復，請重新下載 GCP JSON 金鑰："
  );
  console.error(
    "  node scripts/import-ga4-key-from-json.mjs \"C:\\path\\to\\service-account.json\""
  );
  process.exit(1);
}

try {
  createPrivateKey(key);
  console.log("\nOK：私鑰可解析");
} catch (e) {
  console.error("\nFAIL：", e instanceof Error ? e.message : e);
  console.error("請在 GCP 建立新金鑰並執行 import-ga4-key-from-json.mjs");
  process.exit(1);
}
