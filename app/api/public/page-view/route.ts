import { NextRequest, NextResponse } from "next/server";
import { recordPageViewCore } from "@/lib/analytics/record-page-view-core";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
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
