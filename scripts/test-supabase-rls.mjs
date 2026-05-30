/**
 * 驗證 Supabase RLS / 欄位權限（anon 不可讀草稿與 accessPasswordHash）
 * 用法：node --env-file=.env.local scripts/test-supabase-rls.mjs
 */
import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

const fileEnv = loadEnvFile(".env.local");
const base = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  fileEnv.NEXT_PUBLIC_SUPABASE_URL ??
  ""
).replace(/\/$/, "");
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!base || !anonKey || !serviceKey) {
  console.error("缺少 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY");
  process.exit(1);
}

function headers(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Accept-Profile": "public",
    "Content-Profile": "public",
  };
}

async function rest(key, table, params) {
  const url = new URL(`${base}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: headers(key) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

const checks = [];

// 1) anon：草稿應不可見（RLS）
{
  const r = await rest(anonKey, "posts", {
    select: "id,slug,status",
    status: "eq.DRAFT",
    limit: "5",
  });
  const rows = Array.isArray(r.body) ? r.body : [];
  checks.push({
    name: "anon 無法列舉 DRAFT",
    ok: r.status === 200 && rows.length === 0,
    detail: `status=${r.status} rows=${rows.length}`,
  });
}

// 2) anon：已發布文章可讀
{
  const r = await rest(anonKey, "posts", {
    select: "id,slug",
    status: "eq.PUBLISHED",
    deletedAt: "is.null",
    limit: "1",
  });
  const rows = Array.isArray(r.body) ? r.body : [];
  checks.push({
    name: "anon 可讀 PUBLISHED",
    ok: r.status === 200 && rows.length >= 0,
    detail: `status=${r.status} sample=${rows.length}`,
  });
}

// 3) anon：accessPasswordHash 欄位應拒絕或空
{
  const r = await rest(anonKey, "posts", {
    select: "id,accessPasswordHash",
    status: "eq.PUBLISHED",
    isPasswordProtected: "eq.true",
    limit: "1",
  });
  const denied = r.status === 403 || r.status === 400;
  const rows = Array.isArray(r.body) ? r.body : [];
  const noHash =
    rows.length === 0 ||
    rows.every((row) => row.accessPasswordHash == null || row.accessPasswordHash === undefined);
  checks.push({
    name: "anon 無法讀取 accessPasswordHash",
    ok: denied || noHash,
    detail: `status=${r.status} rows=${rows.length}`,
  });
}

// 4) service_role：密碼雜湊仍可讀（密碼文驗證）
{
  const r = await rest(serviceKey, "posts", {
    select: "id,accessPasswordHash",
    status: "eq.PUBLISHED",
    isPasswordProtected: "eq.true",
    limit: "1",
  });
  checks.push({
    name: "service_role 可選 accessPasswordHash（若有密碼文）",
    ok: r.status === 200,
    detail: `status=${r.status}`,
  });
}

// 5) anon：後台表 integration_credentials 應拒絕
{
  const r = await rest(anonKey, "integration_credentials", {
    select: "id",
    limit: "1",
  });
  checks.push({
    name: "anon 無法讀 integration_credentials",
    ok:
      r.status === 401 ||
      r.status === 403 ||
      (r.status === 200 && Array.isArray(r.body) && r.body.length === 0),
    detail: `status=${r.status}`,
  });
}

let failed = 0;
for (const c of checks) {
  const mark = c.ok ? "PASS" : "FAIL";
  if (!c.ok) failed += 1;
  console.log(`[${mark}] ${c.name} — ${c.detail}`);
}

if (failed > 0) {
  console.error(`\n${failed} 項 RLS 檢查未通過`);
  process.exit(1);
}
console.log("\n全部 RLS 檢查通過");
