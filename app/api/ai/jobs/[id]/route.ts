// app/api/ai/jobs/[id]/route.ts — Node Runtime
// AI Job 狀態查詢（前端 Polling 使用，每 2 秒呼叫一次）

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { aiJobManager } from "@/domain/ai/ai.job-manager";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  // ── JWT 驗證 ─────────────────────────────────────────
  const jar   = await cookies();
  const token = jar.get("access_token")?.value ?? "";

  if (!token) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let userId: string;
  try {
    const payload = await verifyAccessToken(token);
    userId = payload.userId;
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const job = await aiJobManager.getJobStatusForUser(id, userId);

    return NextResponse.json({
      id:           job.id,
      status:       job.status,
      stepIndex:    job.stepIndex,
      retryCount:   job.retryCount,
      result:       job.result,
      failedReason: job.failedReason,
      createdAt:    job.createdAt,
      updatedAt:    job.updatedAt,
    });

  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
