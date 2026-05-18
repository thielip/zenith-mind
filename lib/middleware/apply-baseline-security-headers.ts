// lib/middleware/apply-baseline-security-headers.ts — Edge Runtime
// 單一來源：避免 next.config 與 middleware 重複注入導致掃描器無法解析（nosniff, nosniff）

import type { NextResponse } from "next/server";

export function applyBaselineSecurityHeaders(headers: Headers): void {
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

/** 對 redirect / 403 等提早返回的 Response 注入基線標頭 */
export function secureEarlyResponse<T extends Response>(response: T): T {
  applyBaselineSecurityHeaders(response.headers);
  return response;
}

export function secureEarlyNextResponse(response: NextResponse): NextResponse {
  return secureEarlyResponse(response);
}
