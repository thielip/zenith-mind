import { readFileSync } from "node:fs";

function loadDevVars() {
  const out = {};
  for (const line of readFileSync(".dev.vars", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

const env = loadDevVars();
const base = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const secret = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function keyType(k) {
  if (k.startsWith("eyJ")) return "jwt (legacy service_role)";
  if (k.startsWith("sb_secret_")) return "sb_secret (new secret)";
  if (k.startsWith("sb_publishable_")) return "sb_publishable (anon — WRONG for service)";
  return "unknown";
}

console.log("URL:", base);
console.log("SECRET type:", keyType(secret), "| length:", secret.length);
console.log("ANON type:", keyType(anon), "| length:", anon.length);

async function probe(label, key) {
  if (!key) return;
  const url = `${base}/rest/v1/posts?select=id&status=eq.PUBLISHED&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Accept-Profile": "public",
    },
  });
  const text = await res.text();
  console.log(`\n[${label}] HTTP ${res.status}`);
  console.log(text.slice(0, 200));
}

await probe("SUPABASE_SERVICE_ROLE_KEY", secret);
await probe("NEXT_PUBLIC_SUPABASE_ANON_KEY", anon);

const viewUrl = `${base}/rest/v1/v_post_view_totals?select=post_id,total_views&limit=1`;
const viewRes = await fetch(viewUrl, {
  headers: {
    apikey: secret,
    Authorization: `Bearer ${secret}`,
    Accept: "application/json",
  },
});
console.log(`\n[v_post_view_totals] HTTP ${viewRes.status}`);
console.log((await viewRes.text()).slice(0, 200));
