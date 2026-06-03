/**
 * 公開站資料源健康檢查（避免 REST 403 被誤當「無文章」造成 SEO Soft 404）
 */
import { unstable_cache } from "next/cache";
import { getSupabaseRestConfig, isSupabaseAuthOrForbidden } from "@/lib/db/supabase-rest";

export type PublicDataHealth = "ok" | "empty" | "forbidden" | "unconfigured" | "error";

const PROBE_TTL_MS = 60_000;
let cached: { at: number; health: PublicDataHealth } | null = null;

export async function probePublicPostsHealth(): Promise<PublicDataHealth> {
  const now = Date.now();
  if (cached && now - cached.at < PROBE_TTL_MS) return cached.health;

  const cfg = getSupabaseRestConfig();
  if (!cfg) {
    cached = { at: now, health: "unconfigured" };
    return "unconfigured";
  }

  const url = new URL(`${cfg.base}/rest/v1/posts`);
  url.searchParams.set("select", "id");
  url.searchParams.set("status", "eq.PUBLISHED");
  url.searchParams.set("deletedAt", "is.null");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Accept: "application/json",
        "Accept-Profile": "public",
        "Content-Profile": "public",
      },
    });

    if (res.status === 401 || res.status === 403) {
      cached = { at: now, health: "forbidden" };
      return "forbidden";
    }

    if (!res.ok) {
      cached = { at: now, health: "error" };
      return "error";
    }

    const rows = (await res.json()) as unknown[];
    const health: PublicDataHealth =
      Array.isArray(rows) && rows.length > 0 ? "ok" : "empty";
    cached = { at: now, health };
    return health;
  } catch {
    cached = { at: now, health: "error" };
    return "error";
  }
}

export function isPublicDataDegraded(health: PublicDataHealth): boolean {
  return health === "forbidden" || health === "unconfigured" || health === "error";
}

/** 部落格列表／metadata 共用：60s 快取，避免每請求打 REST count */
export const getCachedPublicPostsHealth = unstable_cache(
  async () => probePublicPostsHealth(),
  ["public-posts-health-probe"],
  { revalidate: 60, tags: ["public-data-health"] }
);

export function healthFromError(error: unknown): PublicDataHealth | null {
  if (isSupabaseAuthOrForbidden(error)) return "forbidden";
  return null;
}
