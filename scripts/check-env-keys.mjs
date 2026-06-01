/**
 * 檢查 env key 是否存在（不輸出 secret 值）
 *
 * 用法：
 *   node --env-file=.env.local scripts/check-env-keys.mjs
 *   node scripts/check-env-keys.mjs --diff
 *   node --env-file=.env.local scripts/check-env-keys.mjs --diff --check-local
 */
import {
  CF_RUNTIME_REQUIRED_KEYS,
  CF_WRANGLER_VAR_KEYS,
  LOCAL_OPS_OPTIONAL_KEYS,
  MUST_NOT_BE_WRANGLER_VARS,
  VERCEL_ADMIN_REQUIRED_KEYS,
  VERCEL_LOCAL_KEYS,
} from "./env-deploy-profiles.mjs";

const args = new Set(process.argv.slice(2));
const diffMode = args.has("--diff");
const checkLocal = args.has("--check-local") || !diffMode;

function present(name) {
  const v = process.env[name]?.trim();
  return Boolean(v);
}

function deriveProject() {
  const explicit = process.env["GOOGLE_CLOUD_PROJECT_ID"]?.trim();
  if (explicit) return explicit;
  const email = process.env["GA4_CLIENT_EMAIL"]?.trim();
  const m = email?.match(/@([^.]+)\.iam\.gserviceaccount\.com$/i);
  return m?.[1];
}

function reportLine(ok, label, detail = "") {
  const suffix = detail ? ` — ${detail}` : "";
  console.log(`[${ok ? "OK" : "MISSING"}] ${label}${suffix}`);
}

function runLocalOpsCheck() {
  let failed = 0;
  for (const key of LOCAL_OPS_OPTIONAL_KEYS) {
    const ok = present(key);
    if (!ok) failed += 1;
    reportLine(ok, key);
  }

  const project = deriveProject();
  if (!project) {
    failed += 1;
    reportLine(false, "GCP project（需 GOOGLE_CLOUD_PROJECT_ID 或 GA4 服務帳號 email）");
  } else {
    reportLine(true, `GCP project: ${project}`);
  }

  const rev = process.env["REVALIDATE_SECRET"]?.trim() ?? "";
  if (rev && rev.length < 32) {
    console.log(`[WARN] REVALIDATE_SECRET 長度 ${rev.length}（建議 ≥32）`);
  }

  return failed;
}

function runDiffReport() {
  let failed = 0;

  console.log("\n── 部署平面 key 差異（僅名稱，不讀取 secret 值）──\n");

  const leakedSecrets = MUST_NOT_BE_WRANGLER_VARS.filter((k) =>
    CF_WRANGLER_VAR_KEYS.has(k)
  );
  if (leakedSecrets.length > 0) {
    failed += leakedSecrets.length;
    console.log("[FAIL] wrangler.toml [vars] 不應包含 secret：");
    for (const k of leakedSecrets) console.log(`       - ${k}`);
  } else {
    console.log("[OK] wrangler.toml [vars] 未提交已知 secret 名稱");
  }

  const cfMissingFromWrangler = CF_RUNTIME_REQUIRED_KEYS.filter(
    (k) => !CF_WRANGLER_VAR_KEYS.has(k) && !["DATABASE_URL", "JWT_ACCESS_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "REDIRECT_LOOKUP_SECRET", "REVALIDATE_SECRET", "PAGEVIEW_HASH_SALT", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "WEBHOOK_SECRET"].includes(k)
  );
  if (cfMissingFromWrangler.length > 0) {
    console.log("[INFO] CF 執行需要但不在 wrangler [vars]（應為 secret 或 Dashboard）：");
    for (const k of cfMissingFromWrangler) console.log(`       - ${k}`);
  }

  const vercelOnly = VERCEL_ADMIN_REQUIRED_KEYS.filter((k) => !CF_RUNTIME_REQUIRED_KEYS.includes(k));
  console.log("\n[INFO] 僅 Vercel 後台需要的 keys（不應強制出現在 CF Worker）：");
  for (const k of vercelOnly) console.log(`       - ${k}`);

  const exampleNotInCfVars = [...VERCEL_LOCAL_KEYS].filter(
    (k) => k.startsWith("NEXT_PUBLIC_") && !CF_WRANGLER_VAR_KEYS.has(k)
  );
  if (exampleNotInCfVars.length > 0) {
    console.log("\n[WARN] .env.example 的 NEXT_PUBLIC_* 未在 wrangler [vars]（若 CF 需要請補上）：");
    for (const k of exampleNotInCfVars.slice(0, 12)) console.log(`       - ${k}`);
    if (exampleNotInCfVars.length > 12) {
      console.log(`       … 另有 ${exampleNotInCfVars.length - 12} 個`);
    }
  }

  if (checkLocal) {
    console.log("\n── 本機 env 相對於 Vercel 建議清單 ──\n");
    const critical = [
      ...VERCEL_ADMIN_REQUIRED_KEYS,
      "DATABASE_URL",
      "JWT_ACCESS_SECRET",
      "JWT_REFRESH_SECRET",
      "ADMIN_DEPLOYMENT_URL",
      "NEXT_PUBLIC_SITE_URL",
    ];
    const unique = [...new Set(critical)];
    for (const key of unique) {
      const ok = present(key);
      if (!ok) failed += 1;
      reportLine(ok, `local:${key}`);
    }
  }

  console.log("\n[hint] CF secret：`npx wrangler secret put <NAME>`");
  console.log("[hint] 本機：`cp .env.example .env.local` 後再執行本腳本\n");

  return failed;
}

let failed = 0;

if (diffMode) {
  failed = runDiffReport();
} else if (checkLocal) {
  failed = runLocalOpsCheck();
}

if (diffMode && args.has("--check-local")) {
  failed += runLocalOpsCheck();
}

process.exit(failed > 0 ? 1 : 0);
