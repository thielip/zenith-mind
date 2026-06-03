import { NextRequest, NextResponse } from "next/server";
import { recordPageViewCore } from "@/lib/analytics/record-page-view-core";
import {
  enforceRateLimitResponse,
  PUBLIC_API_RATE_LIMITS,
} from "@/lib/security/enforce-rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = await enforceRateLimitResponse(
    request.headers,
    "public:page-view",
    PUBLIC_API_RATE_LIMITS.pageView.limit,
    PUBLIC_API_RATE_LIMITS.pageView.windowSec
  );
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = await recordPageViewCore(body, request.headers);
  if (!result.ok) {
    const status =
      result.reason === "validation" ? 400 : result.reason === "missing_salt" ? 503 : 502;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ ok: true });
}
