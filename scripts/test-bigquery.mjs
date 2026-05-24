/**
 * 驗證 BigQuery API（需 .env.local）
 * npx tsx --env-file=.env.local scripts/test-bigquery.mjs
 */
import { config } from "dotenv";
import { validateServiceAccountPrivateKey } from "../lib/google/normalize-private-key.ts";

config({ path: ".env.local" });

const raw = process.env.GA4_PRIVATE_KEY ?? "";
const keyCheck = validateServiceAccountPrivateKey(raw);
console.log("── 私鑰診斷 ──");
console.log("PEM 可解析:", keyCheck.ok ? "是" : "否");
if (!keyCheck.ok) console.log("錯誤:", keyCheck.error);

const { fetchBigQueryHealth } = await import("../services/google/bigquery.ts");
const r = await fetchBigQueryHealth();
console.log("── BigQuery ──");
console.log(JSON.stringify(r, null, 2));
process.exit(r.ok ? 0 : 1);
