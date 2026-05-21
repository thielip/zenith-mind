"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/infrastructure/db/prisma";
import { gateAdminWrite } from "@/lib/auth/resolve-admin-action";
import { Errors, type ActionResult } from "@/domain/shared/core.types";
import { publishRealtimeEvent, createRealtimeEvent } from "@/server/realtime/event-hub";

const AGENTS_PATH = "/admin/dashboard/agents";

function logAgent(message: string, level: "info" | "warn" | "error" = "info") {
  publishRealtimeEvent(
    createRealtimeEvent({
      level,
      channel: "agent",
      message,
    })
  );
}

export async function cancelAgentJobAction(
  jobId: string
): Promise<ActionResult<{ id: string }>> {
  const gate = await gateAdminWrite("analytics");
  if (!gate.ok) return gate.result;

  const job = await prisma.aiJob.findUnique({
    where: { id: jobId },
    select: { id: true, status: true },
  });
  if (!job) {
    return { success: false, data: null, error: Errors.notFound("任務不存在") };
  }
  if (job.status === "DONE" || job.status === "DEAD_LETTER") {
    return {
      success: false,
      data: null,
      error: Errors.validation("此任務已結束，無法取消"),
    };
  }

  await prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: "DEAD_LETTER",
      failedReason: { reason: "CANCELLED_BY_ADMIN" },
      lockedAt: null,
      lockedBy: null,
      timeoutAt: null,
    },
  });

  logAgent(`[Agent] 任務 ${jobId.slice(0, 8)}… 已由管理員取消`, "warn");
  revalidatePath(AGENTS_PATH);
  return { success: true, data: { id: jobId }, error: null };
}

export async function prioritizeAgentJobAction(
  jobId: string
): Promise<ActionResult<{ id: string }>> {
  const gate = await gateAdminWrite("analytics");
  if (!gate.ok) return gate.result;

  const job = await prisma.aiJob.findUnique({
    where: { id: jobId },
    select: { id: true, status: true },
  });
  if (!job || job.status !== "PENDING") {
    return {
      success: false,
      data: null,
      error: Errors.validation("僅能將「等待中」任務設為優先"),
    };
  }

  await prisma.aiJob.update({
    where: { id: jobId },
    data: { createdAt: new Date(0) },
  });

  logAgent(`[Agent] 任務 ${jobId.slice(0, 8)}… 已插隊至佇列最前`, "info");
  revalidatePath(AGENTS_PATH);
  return { success: true, data: { id: jobId }, error: null };
}

export async function clearPendingAgentQueueAction(): Promise<
  ActionResult<{ cleared: number }>
> {
  const gate = await gateAdminWrite("analytics");
  if (!gate.ok) return gate.result;

  const result = await prisma.aiJob.updateMany({
    where: { status: "PENDING" },
    data: {
      status: "DEAD_LETTER",
      failedReason: { reason: "QUEUE_CLEARED_BY_ADMIN" },
    },
  });

  logAgent(`[Agent] 已清空等待中佇列 · ${result.count} 筆`, "warn");
  revalidatePath(AGENTS_PATH);
  return { success: true, data: { cleared: result.count }, error: null };
}

export async function recoverStuckAgentJobsAction(): Promise<
  ActionResult<{ recovered: number }>
> {
  const gate = await gateAdminWrite("analytics");
  if (!gate.ok) return gate.result;

  const now = new Date();
  const timedOut = await prisma.aiJob.findMany({
    where: { status: "PROCESSING", timeoutAt: { lt: now } },
    select: { id: true },
  });

  for (const job of timedOut) {
    await prisma.aiJob.update({
      where: { id: job.id },
      data: {
        status: "PENDING",
        retryCount: { increment: 1 },
        lockedAt: null,
        lockedBy: null,
        timeoutAt: null,
        failedReason: { reason: "RECOVERED_BY_ADMIN" },
      },
    });
  }

  logAgent(`[Agent] 已回收逾時任務 · ${timedOut.length} 筆`, "info");
  revalidatePath(AGENTS_PATH);
  return { success: true, data: { recovered: timedOut.length }, error: null };
}
