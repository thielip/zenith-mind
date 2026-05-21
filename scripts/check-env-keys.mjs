/**
 * 檢查三項常見缺漏 env（不輸出 secret 值）
 * 用法：node --env-file=.env.local scripts/check-env-keys.mjs
 */
const KEYS = [
  "REVALIDATE_SECRET",
  "REDIRECT_LOOKUP_SECRET",
  "BIGQUERY_DATASET_ID",
  "GOOGLE_CLOUD_PROJECT_ID",
];

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

let failed = 0;
for (const key of KEYS) {
  const ok = present(key);
  if (!ok) failed += 1;
  console.log(`[${ok ? "OK" : "MISSING"}] ${key}`);
}

const project = deriveProject();
if (!project) {
  failed += 1;
  console.log("[MISSING] GCP project（需 GOOGLE_CLOUD_PROJECT_ID 或 GA4 服務帳號 email）");
} else {
  console.log(`[OK] GCP project: ${project}`);
}

const rev = process.env["REVALIDATE_SECRET"]?.trim() ?? "";
if (rev && rev.length < 32) {
  console.log(`[WARN] REVALIDATE_SECRET 長度 ${rev.length}（建議 ≥32）`);
}

process.exit(failed > 0 ? 1 : 0);
