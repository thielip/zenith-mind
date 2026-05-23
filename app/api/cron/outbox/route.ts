import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { processEventOutbox } from "@/lib/events/process-event-outbox";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function verifyCronAuth(req: NextRequest): boolean {
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) return false;
  const auth = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(auth);
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const processed = await processEventOutbox();
    logger.info("Outbox cron completed", { meta: { processed } });
    return NextResponse.json({ success: true, processed });
  } catch (e: unknown) {
    logger.error("Outbox cron failed", { meta: { error: String(e) } });
    return NextResponse.json({ error: "OUTBOX_FAILED" }, { status: 500 });
  }
}
