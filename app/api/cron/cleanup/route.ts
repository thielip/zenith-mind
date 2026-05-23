// app/api/cron/cleanup/route.ts — Node Runtime
// 每日清理：PageView 180d + AuditLog 90d（Outbox 改由 /api/cron/outbox）

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  cleanupAuditLogs,
  cleanupPageViews,
} from "@/infrastructure/db/adapters/audit.prisma-adapter";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    logger.error("Cleanup denied: missing CRON_SECRET");
    return NextResponse.json({ error: "CRON_SECRET_REQUIRED" }, { status: 401 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(auth);
  const isValid =
    received.length === expected.length &&
    timingSafeEqual(received, expected);
  if (!isValid) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const results: Record<string, number | string> = {};

  try {
    results["deletedPageViews"] = await cleanupPageViews();
    results["deletedAuditLogs"] = await cleanupAuditLogs();
  } catch (e: unknown) {
    logger.error("Cleanup failed", { meta: { error: String(e) } });
  }

  logger.info("Daily cleanup completed", { meta: results });
  return NextResponse.json({ success: true, ...results });
}
