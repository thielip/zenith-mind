/**
 * 全面檢查：Supabase REST、金鑰類型、線上首頁/部落格
 * 用法：node scripts/check-deployment-readiness.mjs
 */
import { readFileSync } from "node:fs";

function loadDevVars() {
  const out = {};
  try {
    for (const line of readFileSync(".dev.vars", "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 0) continue;
      out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  } catch {
    console.error("MISSING .dev.vars");
  }
  return out;
}

function keyType(k) {
  if (!k) return "missing";
  if (k.startsWith("eyJ")) return "jwt-service-role-legacy";
  if (k.startsWith("sb_secret_")) return "sb_secret";
  if (k.startsWith("sb_publishable_")) return "WRONG-publishable";
  return "unknown";
}

const env = loadDevVars();
const base = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const secret = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const site = env.NEXT_PUBLIC_SITE_URL ?? "https://www.getzenithmind.com";

const checks = [];

function pass(name, detail) {
  checks.push({ name, ok: true, detail });
  console.log(`✅ ${name}: ${detail}`);
}
function fail(name, detail) {
  checks.push({ name, ok: false, detail });
  console.log(`❌ ${name}: ${detail}`);
}

console.log("\n=== 1. 本機金鑰設定 ===");
console.log("SUPABASE URL:", base || "(missing)");
console.log("SERVICE KEY type:", keyType(secret));

if (!secret) fail("service_role key", "未設定 SUPABASE_SERVICE_ROLE_KEY");
else if (keyType(secret) === "WRONG-publishable")
  fail("service_role key", "誤用 sb_publishable（應為 sb_secret 或 eyJ service_role）");
else pass("service_role key format", keyType(secret));

async function rest(table, params = "select=id&limit=1") {
  const url = `${base}/rest/v1/${table}?${params}`;
  const headers = { apikey: secret, Accept: "application/json", "Accept-Profile": "public" };
  if (secret.startsWith("eyJ")) headers.Authorization = `Bearer ${secret}`;
  else headers.Authorization = `Bearer ${secret}`;
  const res = await fetch(url, { headers });
  return { status: res.status, body: await res.text() };
}

console.log("\n=== 2. Supabase REST ===");
if (base && secret) {
  const posts = await rest("posts", "select=id&status=eq.PUBLISHED&deletedAt=is.null&limit=1");
  if (posts.status === 200) pass("REST posts", "200 OK");
  else fail("REST posts", `HTTP ${posts.status} ${posts.body.slice(0, 120)}`);

  const views = await rest("v_post_view_totals", "select=post_id,view_count&limit=1");
  if (views.status === 200) pass("REST v_post_view_totals", "200 OK");
  else if (views.status === 404)
    fail("REST v_post_view_totals", "404 schema cache — 請執行 NOTIFY pgrst, 'reload schema'");
  else fail("REST v_post_view_totals", `HTTP ${views.status} ${views.body.slice(0, 120)}`);
}

console.log("\n=== 3. 線上公開站 ===");
for (const path of ["/zh-TW/blog", "/zh-TW", "/api/health/public-data"]) {
  try {
    const res = await fetch(`${site.replace(/\/$/, "")}${path}`, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZenithReadinessCheck/1.0)" },
      signal: AbortSignal.timeout(55_000),
    });
    const text = await res.text();
    const degraded =
      text.includes("暫時無法載入") ||
      text.includes("temporarily unavailable") ||
      text.includes("系統維護");
    const emptyBlog = text.includes("目前沒有精選文章");
    if (res.status >= 500)
      fail(`GET ${path}`, `HTTP ${res.status}（來源/Worker 異常）`);
    else if (path.includes("blog") && res.status === 200 && (degraded || emptyBlog))
      fail(`GET ${path}`, `200 但內容異常（degraded=${degraded} empty=${emptyBlog}）`);
    else if (path.includes("health") && res.status === 503)
      fail(`GET ${path}`, "503 資料源降級");
    else pass(`GET ${path}`, `HTTP ${res.status}`);
  } catch (e) {
    fail(`GET ${path}`, String(e));
  }
}

console.log("\n=== 總結 ===");
const failed = checks.filter((c) => !c.ok);
if (failed.length === 0) {
  console.log("🎉 全部通過，可視為完成。");
  process.exit(0);
} else {
  console.log(`⚠️  ${failed.length} 項未通過。`);
  console.log("\n建議：");
  console.log("1. SQL Editor 執行 supabase/migrations/20260515130000_fix_postgrest_grants_and_reload.sql");
  console.log("2. 若仍 403：Dashboard → API Keys → Legacy → service_role（eyJ…）→ 更新 .dev.vars + wrangler secret");
  console.log("3. node scripts/test-blog-supabase.mjs 應為 featured 200、view-totals 200");
  console.log("4. PowerShell 部署：npm run build:cf; npx wrangler deploy");
  process.exit(1);
}
