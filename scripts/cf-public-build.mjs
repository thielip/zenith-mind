/**
 * Cloudflare Free（3MiB）公開站建置：
 * 建置前暫移 admin / 後台 API 目錄，完成後還原（不改 repo 結構）。
 * 建置期間隱藏 .env / .env.local，避免機密被打進 .open-next 部署包。
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skipRoot = join(root, ".cf-build-skip");
const hideRoot = join(root, ".cf-build-skip", "env-hide");

/** 僅後台／cron／auth API；公開站保留 webhook、revalidate、search、redirect */
const STASH_PATHS = [
  "app/admin",
  "app/api/admin",
  "app/api/ai",
  "app/api/auth",
  "app/api/cron",
  "app/sentry-example-page",
  "app/api/sentry-example-api",
];

const ENV_FILES_TO_HIDE = [".env", ".env.local", ".env.production"];

const CF_BUILD_ENV_ALLOWLIST = [
  "PATH",
  "PATHEXT",
  "SystemRoot",
  "WINDIR",
  "COMSPEC",
  "TEMP",
  "TMP",
  "HOME",
  "USERPROFILE",
  "NODE_ENV",
  "CF_PUBLIC_ONLY",
  "SKIP_ENV_VALIDATION",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
  "NEXT_PUBLIC_GTM_ID",
  "NEXT_PUBLIC_IMAGE_DELIVERY",
  "NEXT_PUBLIC_UMAMI_WEBSITE_ID",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "ADMIN_DEPLOYMENT_URL",
  "GOOGLE_SEARCH_CONSOLE_SITE_URL",
];

function stashDirs() {
  mkdirSync(skipRoot, { recursive: true });
  for (const rel of STASH_PATHS) {
    const from = join(root, rel);
    if (!existsSync(from)) continue;
    const to = join(skipRoot, rel);
    mkdirSync(dirname(to), { recursive: true });
    if (existsSync(to)) rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
    rmSync(from, { recursive: true, force: true });
    console.log(`[cf-public-build] stashed ${rel}`);
  }
}

function restoreDirs() {
  for (const rel of STASH_PATHS) {
    const from = join(skipRoot, rel);
    const to = join(root, rel);
    if (!existsSync(from)) continue;
    mkdirSync(dirname(to), { recursive: true });
    if (existsSync(to)) rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true });
    rmSync(from, { recursive: true, force: true });
    console.log(`[cf-public-build] restored ${rel}`);
  }
}

function hideEnvFiles() {
  mkdirSync(hideRoot, { recursive: true });
  for (const name of ENV_FILES_TO_HIDE) {
    const from = join(root, name);
    if (!existsSync(from)) continue;
    const to = join(hideRoot, name);
    if (existsSync(to)) rmSync(to, { force: true });
    cpSync(from, to);
    rmSync(from, { force: true });
    console.log(`[cf-public-build] hidden ${name} for build`);
  }
}

function restoreEnvFiles() {
  for (const name of ENV_FILES_TO_HIDE) {
    const from = join(hideRoot, name);
    const to = join(root, name);
    if (!existsSync(from)) continue;
    cpSync(from, to);
    rmSync(from, { force: true });
    console.log(`[cf-public-build] restored ${name}`);
  }
}

function buildCfEnv() {
  const heap =
    process.env.NODE_OPTIONS?.includes("max-old-space-size")
      ? process.env.NODE_OPTIONS
      : "--max-old-space-size=8192";
  const env = {
    CF_PUBLIC_ONLY: "1",
    SKIP_ENV_VALIDATION: "true",
    NODE_ENV: "production",
    NODE_OPTIONS: heap,
    NEXT_PUBLIC_IMAGE_DELIVERY: "supabase-render",
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.getzenithmind.com",
    ADMIN_DEPLOYMENT_URL:
      process.env.ADMIN_DEPLOYMENT_URL ?? "https://zenith-mind.vercel.app",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      "https://qhutexisyfbclxntgkvx.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
  for (const key of CF_BUILD_ENV_ALLOWLIST) {
    const v = process.env[key];
    if (v !== undefined && v !== "") env[key] = v;
  }
  // 無 Auth Token 時勿帶 org/project，避免 @sentry/webpack-plugin 在 CI 上傳失敗
  if (!process.env.SENTRY_AUTH_TOKEN?.trim()) {
    delete env.SENTRY_ORG;
    delete env.SENTRY_PROJECT;
    delete env.SENTRY_AUTH_TOKEN;
  }
  return env;
}

function assertBundleHasNoSecrets() {
  const nextEnv = join(root, ".open-next", "cloudflare", "next-env.mjs");
  if (!existsSync(nextEnv)) return;
  const text = readFileSync(nextEnv, "utf8");
  const forbidden = [
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "GA4_PRIVATE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ADMIN_BOOTSTRAP_PASSWORD",
    "DATABASE_URL",
    "GEMINI_API_KEY",
  ];
  for (const key of forbidden) {
    if (text.includes(key)) {
      console.error(
        `[cf-public-build] SECURITY: ${nextEnv} contains ${key}. Abort deploy.`
      );
      process.exit(1);
    }
  }
  console.log("[cf-public-build] bundle env check OK (no admin secrets)");
}

stashDirs();
hideEnvFiles();
let exitCode = 1;
try {
  const cfOverrides = buildCfEnv();
  Object.assign(process.env, cfOverrides);
  const cfEnv = { ...process.env, ...cfOverrides };
  console.log(
    "[cf-public-build] CF_PUBLIC_ONLY=1 NODE_OPTIONS=%s buildCommand=npm run build:next:public",
    cfEnv.NODE_OPTIONS ?? "(default)"
  );
  const r = spawnSync("npx", ["opennextjs-cloudflare", "build"], {
    cwd: root,
    stdio: "inherit",
    env: cfEnv,
    shell: true,
  });
  exitCode = r.status ?? 1;
  if (exitCode === 0) assertBundleHasNoSecrets();
} finally {
  restoreEnvFiles();
  restoreDirs();
}

process.exit(exitCode);
