// app/api/ai/jobs/[id]/route.ts — Node Runtime
// AI Job 狀態查詢（前端 Polling 使用，每 2 秒呼叫一次）

import { NextRequest, NextResponse } from "next/server";
import { gateAdminOnly } from "@/lib/auth/resolve-admin-action";
import { aiJobManager } from "@/domain/ai/ai.job-manager";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const gate = await gateAdminOnly();
  if (!gate.ok) {
    const status = gate.result.error?.code === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json(
      { error: status === 403 ? "FORBIDDEN" : "UNAUTHORIZED" },
      { status }
    );
  }

  const userId = gate.session.userId;
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
