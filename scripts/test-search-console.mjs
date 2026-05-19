/**
 * 驗證 Search Console API（需 .env.local）
 * npx tsx --env-file=.env.local scripts/test-search-console.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });

const { getSearchConsoleAuthMode } = await import("../services/google/auth.ts");
const { fetchSearchConsoleSummary } = await import(
  "../services/google/search-console.ts"
);
const { normalizeGscSiteUrl } = await import("../lib/google/gsc-site-url.ts");

const mode = getSearchConsoleAuthMode();
const siteUrl = normalizeGscSiteUrl(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL);

console.log("── 設定診斷 ──");
console.log("認證方式:", mode);
console.log("GSC 資源 URL:", siteUrl ?? "(未設定)");
console.log(
  "GSC_OAUTH:",
  process.env.GSC_OAUTH_REFRESH_TOKEN ? "已設定 refresh token" : "未設定"
);
if (mode === "service_account") {
  console.log("服務帳號:", process.env.GA4_CLIENT_EMAIL ?? "(無)");
  console.log(
    "\n若 GSC 無法「新增使用者」服務帳號，請改設 GSC_OAUTH_*（docs/COMMAND-CENTER-INTEGRATIONS.md §2.2b）\n"
  );
}

const r = await fetchSearchConsoleSummary();
console.log("── API 結果 ──");
console.log(JSON.stringify(r, null, 2));
process.exit(r.ok ? 0 : 1);
