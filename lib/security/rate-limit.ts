import { redis } from "@/infrastructure/redis/client";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * 固定視窗計數（Upstash Redis INCR + EXPIRE）
 * Edge / Node 皆可（REST Redis）
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
    return { allowed, remaining: Math.max(0, limit - count) };
  } catch (e: unknown) {
    // Redis 不可用時不阻斷主流程（降級）
    console.error("[rate-limit] Redis error:", e);
    return { allowed: true, remaining: limit };
  }
}

export function rateLimitKeyIp(ip: string, route: string): string {
  const safeIp = ip.replace(/[^a-zA-Z0-9.:]/g, "_").slice(0, 64);
  return `${route}:${safeIp}`;
}
