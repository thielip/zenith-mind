/**
 * Next.js production build for Cloudflare public site only.
 * Sets CF_PUBLIC_ONLY before next.config loads (via env on child process).
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

process.env.CF_PUBLIC_ONLY = "1";
process.env.SKIP_ENV_VALIDATION = "true";
if (!process.env.NODE_OPTIONS?.includes("max-old-space-size")) {
  process.env.NODE_OPTIONS = "--max-old-space-size=8192";
}

console.log(
  "[cf-next-build] CF_PUBLIC_ONLY=1 NODE_OPTIONS=%s",
  process.env.NODE_OPTIONS
);

execSync("npx next build", {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
