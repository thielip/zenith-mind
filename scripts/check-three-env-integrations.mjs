/**
 * 僅檢查 Revalidate / Redirect / BigQuery 三項 env 串接狀態
 * 用法：node --env-file=.env.local scripts/check-three-env-integrations.mjs
 */
function hasEnv(name) {
  return Boolean(process.env[name]?.trim());
}

function deriveGcpProjectId() {
  const explicit = process.env["GOOGLE_CLOUD_PROJECT_ID"]?.trim();
  if (explicit) return explicit;
  const email = process.env["GA4_CLIENT_EMAIL"]?.trim();
  const m = email?.match(/@([^.]+)\.iam\.gserviceaccount\.com$/i);
  return m?.[1];
}

const checks = [
  {
    id: "revalidate",
    name: "Revalidate Secret",
    ok: hasEnv("REVALIDATE_SECRET"),
    missing: hasEnv("REVALIDATE_SECRET") ? [] : ["REVALIDATE_SECRET"],
  },
  {
    id: "redirect",
    name: "Redirect Lookup Secret",
    ok: hasEnv("REDIRECT_LOOKUP_SECRET"),
    missing: hasEnv("REDIRECT_LOOKUP_SECRET") ? [] : ["REDIRECT_LOOKUP_SECRET"],
  },
  {
    id: "google-bigquery",
    name: "BigQuery",
    ok: false,
    missing: [],
  },
];

const bqMissing = [];
if (!hasEnv("BIGQUERY_DATASET_ID")) bqMissing.push("BIGQUERY_DATASET_ID");
const project = deriveGcpProjectId();
if (!project) bqMissing.push("GOOGLE_CLOUD_PROJECT_ID（或 GA4_CLIENT_EMAIL）");
checks[2].missing = bqMissing;
checks[2].ok = bqMissing.length === 0;
checks[2].project = project;

let failed = 0;
for (const c of checks) {
  const flag = c.ok ? "OK" : "MISSING";
  if (!c.ok) failed += 1;
  console.log(`[${flag}] ${c.name}`);
  if (c.missing.length) console.log(`       missing: ${c.missing.join(", ")}`);
  if (c.project) console.log(`       project: ${c.project}`);
}

process.exit(failed > 0 ? 1 : 0);
