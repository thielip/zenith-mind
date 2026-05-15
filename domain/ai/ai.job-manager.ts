// domain/ai/ai.job-manager.ts — Node Runtime
// AI Job 狀態機：PENDING → PROCESSING → DONE / FAILED / DEAD_LETTER
// 含 SLA 追蹤、逾時 Watchdog、DEAD_LETTER 告警

import { prisma } from "@/infrastructure/db/prisma";
import { logger } from "@/lib/logger";
import type { AiJob, Prisma } from "@prisma/client";

const MAX_RETRY      = 3;
const LOCK_TIMEOUT_S = 120; // 2 分鐘 SLA，超時 Watchdog 接管
const WORKER_ID      = `worker-${process.env["VERCEL_REGION"] ?? "local"}-${Date.now()}`;

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

export class AiJobManager {

  // ── 取出 PENDING Job（原子操作，防併發）────────────────

  async claimNextJob(): Promise<AiJob | null> {
    // 先做 Watchdog：將逾時的 PROCESSING Job 重置為 PENDING
    await this.recoverTimedOutJobs();

    // 找出最老的 PENDING Job（FIFO）
    const job = await prisma.aiJob.findFirst({
      where:   { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (!job) return null;

    const now     = new Date();
    const timeout = new Date(now.getTime() + LOCK_TIMEOUT_S * 1000);

    // 原子更新（條件寫：status 必須仍是 PENDING，防競態）
    const updated = await prisma.aiJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data:  {
        status:    "PROCESSING",
        lockedAt:  now,
        lockedBy:  WORKER_ID,
        startedAt: now,
        timeoutAt: timeout,
      },
    });

    if (updated.count === 0) return null; // 被其他 Worker 搶走

    return prisma.aiJob.findUniqueOrThrow({ where: { id: job.id } });
  }

  // ── 標記 DONE ─────────────────────────────────────────

  async markDone(jobId: string, result: unknown): Promise<void> {
    await prisma.aiJob.update({
      where: { id: jobId },
      data:  {
        status:    "DONE",
        result:    result ?? undefined,
        lockedAt:  null,
        lockedBy:  null,
        timeoutAt: null,
        updatedAt: new Date(),
      },
    });

    // 寫入 EventOutbox → Cron 觸發 revalidatePath
    await prisma.eventOutbox.create({
      data: { eventType: "AI_JOB_DONE", payload: { jobId } },
    });

    logger.info("AI Job completed", { jobId });
  }

  // ── 標記 FAILED（含重試邏輯）─────────────────────────

  async markFailed(
    jobId:  string,
    reason: unknown,
    shouldRetry: boolean
  ): Promise<void> {
    const job = await prisma.aiJob.findUniqueOrThrow({ where: { id: jobId } });
    const nextRetry = job.retryCount + 1;

    if (shouldRetry && nextRetry <= MAX_RETRY) {
      // 指數退避：1min、2min、4min
      const delayMs = Math.pow(2, job.retryCount) * 60 * 1000;

      await prisma.aiJob.update({
        where: { id: jobId },
        data:  {
          status:      "PENDING",    // 重置為 PENDING，等待下次 Worker 取走
          retryCount:  nextRetry,
          failedReason: toJson(reason),
          lockedAt:    null,
          lockedBy:    null,
          timeoutAt:   null,
        },
      });

      logger.warn("AI Job will retry", { jobId, meta: { retryCount: nextRetry, delayMs } });
    } else {
      // 超過重試次數 or 不可重試 → DEAD_LETTER
      await prisma.aiJob.update({
        where: { id: jobId },
        data:  {
          status:       "DEAD_LETTER",
          failedReason: toJson(reason),
          lockedAt:     null,
          lockedBy:     null,
          timeoutAt:    null,
        },
      });

      // 寫入 EventOutbox → Cron 發送告警 Email
      await prisma.eventOutbox.create({
        data: {
          eventType: "AI_JOB_DEAD_LETTER",
          payload:   { jobId, reason: toJson(reason), retryCount: nextRetry },
        },
      });

      logger.error("AI Job dead-lettered", { jobId, meta: { reason } });
    }
  }

  // ── Watchdog：回收逾時 Job ─────────────────────────────

  private async recoverTimedOutJobs(): Promise<void> {
    const now = new Date();

    const timedOut = await prisma.aiJob.findMany({
      where: {
        status:    "PROCESSING",
        timeoutAt: { lt: now },
      },
      select: { id: true, retryCount: true },
    });

    for (const job of timedOut) {
      logger.warn("AI Job timed out, recovering", { jobId: job.id });
      await this.markFailed(job.id, { reason: "LOCK_TIMEOUT" }, true);
    }
  }

  // ── 查詢 Job 狀態（Polling API 使用）─────────────────

  async getJobStatus(jobId: string): Promise<AiJob> {
    return prisma.aiJob.findUniqueOrThrow({ where: { id: jobId } });
  }

  async getJobStatusForUser(jobId: string, userId: string): Promise<AiJob> {
    return prisma.aiJob.findFirstOrThrow({ where: { id: jobId, userId } });
  }
}

export const aiJobManager = new AiJobManager();
