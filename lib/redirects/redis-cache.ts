import { Redis } from "@upstash/redis";
import type { ActiveRedirect } from "@/lib/redirects/queries";

const KEY_PREFIX = "redirect:v1:";
/** 負向快取標記（pathname 無轉址） */
export const REDIRECT_CACHE_MISS = "__MISS__";
const NEGATIVE_TTL_SEC = 600; // 10 分鐘
const POSITIVE_TTL_SEC = 60 * 60 * 24 * 7; // 7 天

function cacheKey(pathname: string): string {
  return `${KEY_PREFIX}${pathname}`;
}

function getRedis(): Redis | null {
  if (!process.env["UPSTASH_REDIS_REST_URL"]?.trim()) return null;
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

export type RedirectCacheLookup =
  | { kind: "hit"; redirect: ActiveRedirect }
  | { kind: "negative" }
  | { kind: "unknown" };

export async function getRedirectFromCache(
  pathname: string
): Promise<RedirectCacheLookup> {
  const redis = getRedis();
  if (!redis) return { kind: "unknown" };

  const raw = await redis.get<string>(cacheKey(pathname));
  if (raw === REDIRECT_CACHE_MISS) return { kind: "negative" };
  if (!raw || typeof raw !== "string") return { kind: "unknown" };

  try {
    const parsed = JSON.parse(raw) as ActiveRedirect;
    if (!parsed?.newPath) return { kind: "unknown" };
    return { kind: "hit", redirect: parsed };
  } catch {
    return { kind: "unknown" };
  }
}

export async function setRedirectCache(
  pathname: string,
  redirect: ActiveRedirect | null
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const key = cacheKey(pathname);
  if (!redirect) {
    await redis.set(key, REDIRECT_CACHE_MISS, { ex: NEGATIVE_TTL_SEC });
    return;
  }

  await redis.set(key, JSON.stringify(redirect), { ex: POSITIVE_TTL_SEC });
}

export async function invalidateRedirectCache(pathname: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(cacheKey(pathname));
}
