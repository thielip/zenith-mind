import { NextResponse } from "next/server";
import { probePublicPostsHealth, isPublicDataDegraded } from "@/lib/db/public-data-health";

export const dynamic = "force-dynamic";

/** 監控／爬蟲探針：資料源異常時回 503（避免 Soft 404 被索引） */
export async function GET(): Promise<NextResponse> {
  const health = await probePublicPostsHealth();
  if (isPublicDataDegraded(health)) {
    return NextResponse.json(
      { status: "degraded", health },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "300",
        },
      }
    );
  }
  return NextResponse.json({ status: "ok", health });
}
