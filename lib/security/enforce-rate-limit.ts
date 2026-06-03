import { NextResponse } from "next/server";
import { resolveClientIpFromHeaders } from "@/lib/request/client-ip";
import { checkRateLimit, rateLimitKeyIp } from "@/lib/security/rate-limit";

/** 公開 API 限流預設（每 IP） */
export const PUBLIC_API_RATE_LIMITS = {
  pageView: { limit: 60, windowSec: 60 },
  search: { limit: 30, windowSec: 60 },
} as const;

/**
 * 若超過限流則回 429；否則回 null（呼叫端繼續處理）
 */
export async function enforceRateLimitResponse(
  headers: Headers,
  route: string,
  limit: number,
  windowSec: number
): Promise<NextResponse | null> {
  const ip = resolveClientIpFromHeaders(headers);
  const rl = await checkRateLimit(rateLimitKeyIp(ip, route), limit, windowSec);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT", retryAfterSec: windowSec },
      {
        status: 429,
        headers: { "Retry-After": String(windowSec) },
      }
    );
  }
  return null;
}
