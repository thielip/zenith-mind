/**
 * 公開資料平面執行環境 — 全專案唯一允許讀取 CF_WORKER_RUNTIME 的閘道（除 cf-public-runtime 定義處）。
 * 業務 loader 請改用 getPublicReadRepository()，勿直接分支 isCfPublicRuntime。
 */
import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";

export function isPublicCfBackend(): boolean {
  return isCfPublicRuntime();
}

/** @deprecated 使用 isPublicCfBackend；保留名稱供遷移期呼叫端 */
export const isCfPublicRuntimeForPublicReads = isPublicCfBackend;

export async function withPublicReadBackend<T>(
  supabase: () => Promise<T>,
  prisma: () => Promise<T>
): Promise<T> {
  if (isCfPublicRuntime()) return supabase();
  return prisma();
}
