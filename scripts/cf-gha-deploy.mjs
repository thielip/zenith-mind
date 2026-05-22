/**
 * GitHub Actions：build:cf 完成後只上傳 .open-next，不觸發 wrangler.toml [build]。
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

console.log("[cf-gha-deploy] wrangler deploy（略過 [build]，使用既有 .open-next）");

const result = spawnSync(
  "npx",
  ["wrangler", "deploy", "--config", "wrangler.deploy.toml", "--no-bundle"],
  {
    cwd: root,
    env: process.env,
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
