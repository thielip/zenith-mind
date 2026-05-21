// app/api/cron/cleanup/route.ts — Node Runtime
// 每日清理 Cron（每天凌晨 3 點，見 vercel.json）
// 職責：PageView 180 天清理 + AuditLog 90 天清理 + EventOutbox 處理

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  cleanupAuditLogs,
  cleanupPageViews,
} from "@/infrastructure/db/adapters/audit.prisma-adapter";
import { prisma } from "@/infrastructure/db/prisma";
import { logger } from "@/lib/logger";
import { sendAlertEmail } from "@/lib/alert/send-alert-email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Cron Job 身份驗證
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    logger.error("Cleanup denied: missing CRON_SECRET");
    return NextResponse.json({ error: "CRON_SECRET_REQUIRED" }, { status: 401 });
  }

  const auth     = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(auth);
  const isValid  =
    received.length === expected.length &&
    timingSafeEqual(received, expected);
  if (!isValid) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const results: Record<string, number | string> = {};

  // ── 1. 清理舊資料 ────────────────────────────────────
  try {
    results["deletedPageViews"] = await cleanupPageViews();
    results["deletedAuditLogs"] = await cleanupAuditLogs();
  } catch (e: unknown) {
    logger.error("Cleanup failed", { meta: { error: String(e) } });
  }

  // ── 2. 處理 EventOutbox（PENDING → 執行副作用）──────
  try {
    const events = await prisma.eventOutbox.findMany({
      where:   { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take:    50,
    });

    for (const event of events) {
      try {
        switch (event.eventType) {
          case "POST_PUBLISHED":
          case "AI_JOB_DONE":
            revalidateTag("posts");
            revalidatePath("/blog", "layout");
            break;

          case "AI_JOB_DEAD_LETTER": {
            const payloadText = JSON.stringify(event.payload ?? {}, null, 2);
            logger.error("AI Job dead-letter alert", {
              meta: { payload: event.payload },
            });
            const mail = await sendAlertEmail({
              subject: "[Zenith Mind] AI Job dead letter",
              text: `AI 任務進入 dead letter，請至後台 Agent 中控檢查。\n\n${payloadText}`,
            });
            if (!mail.sent) {
              logger.warn("AI dead-letter email skipped", {
                meta: { reason: mail.reason },
              });
            }
            break;
          }
        }

        await prisma.eventOutbox.update({
          where: { id: event.id },
          data:  { status: "PROCESSED", processedAt: new Date() },
        });

      } catch (e: unknown) {
        await prisma.eventOutbox.update({
          where: { id: event.id },
          data:  { status: "FAILED", error: String(e) },
        });
      }
    }

    results["processedEvents"] = events.length;
  } catch (e: unknown) {
    logger.error("EventOutbox processing failed", { meta: { error: String(e) } });
  }

  logger.info("Daily cleanup completed", { meta: results });
  return NextResponse.json({ success: true, ...results });
}
