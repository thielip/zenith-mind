import { getCloudflareContext } from "@opennextjs/cloudflare";

/** OpenNext on CF：執行期變數在 `env` binding，不一定出現在 `process.env` */
export function readWorkerEnv(name: string): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const bindings = env as Record<string, string | undefined>;
    const fromBinding = bindings[name]?.trim();
    if (fromBinding) return fromBinding;
  } catch {
    /* 非 Worker 請求上下文（本機 next dev、Jest） */
  }

  const fromProcess = process.env[name]?.trim();
  return fromProcess || undefined;
}
