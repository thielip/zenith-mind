// app/api/ai/jobs/route.ts — Node Runtime
// 建立 AI Job（Admin 後台呼叫，寫入 DB）
// idempotencyKey UNIQUE 防止 UI 連點重複送出

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { gateAdminOnly } from "@/lib/auth/resolve-admin-action";
import { CreateAiJobSchema } from "@/domain/ai/ai.validator";
import { prisma } from "@/infrastructure/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const gate = await gateAdminOnly();
  if (!gate.ok) {
    const status = gate.result.error?.httpStatus ?? 401;
    return NextResponse.json(
      { error: gate.result.error?.code ?? "UNAUTHORIZED" },
      { status }
    );
  }
  const userId = gate.session.userId;

  // ── 解析 + Zod 驗證 ──────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = CreateAiJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { type, postId, idempotencyKey, options } = parsed.data;

  // ── 建立 Job（idempotencyKey UNIQUE 防重複）──────────
  try {
    const job = await prisma.aiJob.create({
      data: {
        idempotencyKey,
        type,
        status:  "PENDING",
        payload: JSON.parse(JSON.stringify(options ?? {})) as Prisma.InputJsonValue,
        postId,
        userId,
      },
    });

    return NextResponse.json({ success: true, jobId: job.id }, { status: 201 });

  } catch (e: unknown) {
    // Prisma unique constraint → 同一 idempotencyKey 已存在
    const isUniqueError =
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002";

    if (isUniqueError) {
      // 冪等：回傳已存在的 Job
      const existing = await prisma.aiJob.findUnique({
        where: { idempotencyKey },
      });
      return NextResponse.json({ success: true, jobId: existing?.id, idempotent: true });
    }

    console.error("[AI Jobs] create error:", e);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
