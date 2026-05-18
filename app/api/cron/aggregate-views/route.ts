// 每日彙總 page_views → daily_aggregates / site_daily_aggregates（Vercel Cron）
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/infrastructure/db/prisma";
import { logger } from "@/lib/logger";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET_REQUIRED" }, { status: 401 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(auth);
  const isValid =
    received.length === expected.length && timingSafeEqual(received, expected);
  if (!isValid) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    await prisma.$executeRaw`SELECT public.refresh_page_view_daily_aggregates()`;
    revalidateTag("page-view-stats");
    revalidateTag("homepage-stats");

    logger.info("Daily page view aggregates refreshed");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("aggregate-views failed", { meta: { error: String(error) } });
    return NextResponse.json(
      { error: "AGGREGATE_FAILED", detail: String(error) },
      { status: 500 }
    );
  }
}
