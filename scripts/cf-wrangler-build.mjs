/**
 * Wrangler [build].command 的跨平台入口（Windows / Linux / macOS）。
 * 勿使用 `CF_PUBLIC_ONLY=1 npm run build:cf`（僅 bash 有效）。
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workerJs = join(root, ".open-next", "worker.js");

if (process.env["CF_SKIP_BUILD"] === "1" && existsSync(workerJs)) {
  console.log("[cf-wrangler-build] CF_SKIP_BUILD=1，略過重建（使用既有 .open-next）");
  process.exit(0);
}

const env = {
  ...process.env,
  CF_PUBLIC_ONLY: "1",
  SKIP_ENV_VALIDATION: "true",
  NODE_OPTIONS: process.env["NODE_OPTIONS"] ?? "--max-old-space-size=8192",
};

console.log(
  `[cf-wrangler-build] CF_PUBLIC_ONLY=1 NODE_OPTIONS=${env.NODE_OPTIONS}`
);

const result = spawnSync("npm", ["run", "build:cf"], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status === 0 ? 0 : 1);
