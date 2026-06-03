import { redis } from "@/infrastructure/redis/client";
import {
  checkMemoryRateLimit,
  type RateLimitBackend,
  type RateLimitResult,
} from "@/lib/security/rate-limit-memory";

export type { RateLimitBackend, RateLimitResult };

/**
 * 固定視窗計數（Upstash Redis INCR + EXPIRE）
 * Redis 故障 → 記憶體滑動視窗（fail-closed，不再 fail-open）
 * Edge / Node 皆可（REST Redis + 程序內降級）
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const bucket = `rl:${key}`;
  try {
    const count = await redis.incr(bucket);
    if (count === 1) {
      await redis.expire(bucket, windowSec);
    }
    const allowed = count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - count),
      backend: "redis",
    };
  } catch (e: unknown) {
    if (!process.env["SECURITY_MATRIX_QUIET"]) {
      console.error("[rate-limit] Redis error, falling back to memory:", e);
    }
    const mem = checkMemoryRateLimit(key, limit, windowSec * 1000);
    if (!mem.allowed) return mem;

    // 記憶體降級仍允許時回傳 memory；極端情況生產環境可改為 deny（目前依需求以 memory 為準）
    return mem;
  }
}

export function rateLimitKeyIp(ip: string, route: string): string {
  const safeIp = ip.replace(/[^a-zA-Z0-9.:]/g, "_").slice(0, 64);
  return `${route}:${safeIp}`;
}
