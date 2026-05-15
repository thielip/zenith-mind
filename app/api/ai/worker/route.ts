// app/api/ai/worker/route.ts — Node Runtime
// Vercel Cron Job Worker（每分鐘觸發，見 vercel.json）
// 職責：從 Redis Queue 取 Job → DB 狀態機 → Orchestrator 執行

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { aiJobManager } from "@/domain/ai/ai.job-manager";
import { AiOrchestrator } from "@/domain/ai/ai.orchestrator";
import { openAiAdapter } from "@/infrastructure/ai/openai.adapter";
import { logger } from "@/lib/logger";
import type { GenerateDraftPayload } from "@/domain/ai/ai.validator";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro 最大 60 秒

const orchestrator = new AiOrchestrator(openAiAdapter);

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Cron Job 身份驗證（Vercel 自動注入 Authorization header）
  const authHeader = req.headers.get("authorization") ?? "";

  // Vercel Cron 環境下，secret 由 CRON_SECRET 環境變數控制
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    logger.error("AI Worker denied: missing CRON_SECRET");
    return NextResponse.json({ error: "CRON_SECRET_REQUIRED" }, { status: 401 });
  }

  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  const isValid  =
    received.length === expected.length &&
    timingSafeEqual(received, expected);

  if (!isValid) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const workerId  = crypto.randomUUID();
  const startedAt = Date.now();

  logger.info("AI Worker started", { workerId });

  try {
    // ── 取出下一個 PENDING Job ────────────────────────────
    const job = await aiJobManager.claimNextJob();

    if (!job) {
      logger.info("AI Worker: no pending jobs", { workerId });
      return NextResponse.json({ success: true, processed: 0 });
    }

    logger.info("AI Worker processing job", {
      workerId,
      jobId:  job.id,
      type:   job.type,
      retry:  job.retryCount,
    });

    // ── 依 Job Type 分發 ──────────────────────────────────
    let result;

    switch (job.type) {
      case "GENERATE_DRAFT": {
        const payload = job.payload as GenerateDraftPayload;
        result = await orchestrator.generateDraft(
          job.id,
          payload,
          job.stepIndex // Checkpoint：從上次中斷點續跑
        );
        break;
      }

      // 未來擴充：OPTIMIZE_TITLE、EXTRACT_FAQ
      default:
        logger.warn("AI Worker: unknown job type", { workerId, type: job.type });
        await aiJobManager.markFailed(job.id, { reason: "UNKNOWN_JOB_TYPE" }, false);
        return NextResponse.json({ success: true, processed: 1, status: "UNKNOWN_TYPE" });
    }

    // ── 處理結果 ──────────────────────────────────────────
    if (result.success) {
      await aiJobManager.markDone(job.id, result.data);
    } else {
      const shouldRetry = result.error.retryable;
      await aiJobManager.markFailed(job.id, result.error, shouldRetry);
    }

    const elapsed = Date.now() - startedAt;
    logger.info("AI Worker finished", {
      workerId,
      jobId:   job.id,
      success: result.success,
      elapsedMs: elapsed,
    });

    return NextResponse.json({
      success:   true,
      processed: 1,
      jobId:     job.id,
      elapsedMs: elapsed,
    });

  } catch (e: unknown) {
    logger.error("AI Worker unexpected error", {
      workerId,
      meta: { error: String(e) },
    });
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
