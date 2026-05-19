/**
 * Cloudflare Free（3MiB）公開站建置：
 * 建置前暫移 admin / 後台 API 目錄，完成後還原（不改 repo 結構）。
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skipRoot = join(root, ".cf-build-skip");

/** 僅後台／cron／auth API；公開站保留 webhook、revalidate、search、redirect */
const STASH_PATHS = [
  "app/admin",
  "app/api/admin",
  "app/api/ai",
  "app/api/auth",
  "app/api/cron",
];

function stash() {
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

function restore() {
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

const env = {
  ...process.env,
  CF_PUBLIC_ONLY: "1",
  SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION ?? "true",
  NEXT_PUBLIC_IMAGE_DELIVERY: process.env.NEXT_PUBLIC_IMAGE_DELIVERY ?? "supabase-render",
};

stash();
let exitCode = 1;
try {
  const r = spawnSync("npx", ["opennextjs-cloudflare", "build"], {
    cwd: root,
    stdio: "inherit",
    env,
    shell: true,
  });
  exitCode = r.status ?? 1;
} finally {
  restore();
}

process.exit(exitCode);
