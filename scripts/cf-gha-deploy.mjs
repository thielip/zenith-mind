/**
 * GitHub Actions：build:cf 完成後只上傳 .open-next，不觸發 wrangler.toml [build]。
 * 使用 wrangler deploy（與 Cloudflare Dashboard Git 相同），勿用 opennextjs-cloudflare deploy：
 * 後者在 CI 會跑 getPlatformProxy，對 WORKER_SELF_REFERENCE 等 binding 易失敗。
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workerJs = join(root, ".open-next", "worker.js");
const deployToml = join(root, "wrangler.deploy.toml");

if (!existsSync(workerJs)) {
  console.error("[cf-gha-deploy] 缺少 .open-next/worker.js，請先執行 npm run build:cf");
  process.exit(1);
}

let toml = readFileSync(join(root, "wrangler.toml"), "utf8");
toml = toml.replace(/\r?\n\[build\][\s\S]*?(?=\r?\n\[)/, "\n");
writeFileSync(deployToml, toml);

console.log("[cf-gha-deploy] wrangler deploy --no-bundle（略過 [build]）");

const env = {
  ...process.env,
  OPEN_NEXT_DEPLOY: "true",
  CF_SKIP_BUILD: "1",
  CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
};
for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]) {
  delete env[key];
}

const result = spawnSync(
  "npx",
  ["wrangler", "deploy", "--config", "wrangler.deploy.toml", "--no-bundle"],
  {
    cwd: root,
    env,
    stdio: "inherit",
    shell: true,
  }
);

try {
  unlinkSync(deployToml);
} catch {
  /* ignore */
}

process.exit(result.status === 0 ? 0 : 1);
