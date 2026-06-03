import { redis } from "@/infrastructure/redis/client";
import { incrementMemoryRateLimitCounter } from "@/lib/security/rate-limit-memory";

/**
 * 遞增計數器（用於失敗次數等）；Redis 故障時降級記憶體。
 */
export async function incrementRateLimitCounter(
  key: string,
  windowSec: number
): Promise<number> {
  const bucket = `rlcnt:${key}`;
  try {
    const count = await redis.incr(bucket);
    if (count === 1) {
      await redis.expire(bucket, windowSec);
    }
    return count;
  } catch (e: unknown) {
    if (!process.env["SECURITY_MATRIX_QUIET"]) {
      console.error("[rate-limit-counter] Redis error, memory fallback:", e);
    }
    return incrementMemoryRateLimitCounter(key, windowSec * 1000);
  }
}
