/** Cloudflare 公開站 Worker（wrangler.toml [vars] CF_WORKER_RUNTIME=1） */
export function isCfPublicRuntime(): boolean {
  return process.env["CF_WORKER_RUNTIME"] === "1";
}
