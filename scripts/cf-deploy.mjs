/**
 * 本機部署 Cloudflare Worker（Windows 可用）。
 * 1) npm run build:cf
 * 2) wrangler deploy（略過 wrangler.toml 內重建）
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workerJs = join(root, ".open-next", "worker.js");

function run(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(workerJs)) {
  console.log("[cf-deploy] 未找到 .open-next/worker.js，先執行 build:cf …");
  run("npm", ["run", "build:cf"], {
    CF_PUBLIC_ONLY: "1",
    SKIP_ENV_VALIDATION: "true",
    NODE_OPTIONS: process.env["NODE_OPTIONS"] ?? "--max-old-space-size=8192",
  });
} else {
  console.log("[cf-deploy] 使用既有 .open-next 輸出（可加 -Rebuild 強制重建）");
}

console.log("[cf-deploy] wrangler deploy（CF_SKIP_BUILD=1，不重跑 OpenNext build）…");
run("npx", ["wrangler", "deploy", "--no-bundle"], {
  CF_SKIP_BUILD: "1",
});

console.log("[cf-deploy] 完成。請開啟 https://www.getzenithmind.com/zh-TW 驗證。");
