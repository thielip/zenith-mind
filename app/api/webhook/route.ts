// app/api/webhook/route.ts — Node Runtime
// Webhook 接收端：HMAC-SHA256 + Timestamp ±5分鐘 + Nonce Redis NX 防重放
// ⚠ 三重防護缺一不可，漏任一項均可偽造或重放

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { consumeWebhookNonce } from "@/infrastructure/redis/webhook-nonce";
import { prisma } from "@/infrastructure/db/prisma";

export const dynamic = "force-dynamic";

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // ±5 分鐘

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── 1. 讀取 Headers ──────────────────────────────────
    const signature = req.headers.get("x-webhook-signature") ?? "";
    const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
    const nonce     = req.headers.get("x-webhook-nonce") ?? "";

    if (!signature || !timestamp || !nonce) {
      return NextResponse.json({ error: "MISSING_HEADERS" }, { status: 401 });
    }

    // ── 2. Timestamp 驗證（防重放：5 分鐘窗口）──────────
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
      return NextResponse.json({ error: "TIMESTAMP_EXPIRED" }, { status: 401 });
    }

    // ── 3. 讀取 Body（驗簽前不能消耗 stream）────────────
    const rawBody = await req.text();

    // ── 4. HMAC-SHA256 簽名驗證（timing-safe 比對）──────
    const webhookSecret = process.env["WEBHOOK_SECRET"];
    if (!webhookSecret) {
      return NextResponse.json({ error: "WEBHOOK_SECRET_REQUIRED" }, { status: 401 });
    }

    const expected = createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }

    // ── 5. Nonce 防重放（Redis NX 原子操作）─────────────
    const nonceOk = await consumeWebhookNonce(nonce);
    if (!nonceOk) {
      return NextResponse.json({ error: "NONCE_REPLAYED" }, { status: 401 });
    }

    // ── 6. 處理 Webhook Payload ───────────────────────────
    const payload = JSON.parse(rawBody) as { event?: string; data?: unknown };
    const event   = payload.event ?? "";

    switch (event) {
      case "POST_PUBLISHED": {
        // 觸發 ISR revalidate（寫入 EventOutbox，由 Cron 處理）
        await prisma.eventOutbox.create({
          data: { eventType: "POST_PUBLISHED", payload: payload.data ?? {} },
        });
        break;
      }
      case "AI_JOB_DONE": {
        await prisma.eventOutbox.create({
          data: { eventType: "AI_JOB_DONE", payload: payload.data ?? {} },
        });
        break;
      }
      default:
        // 未知事件：記錄但不報錯（向前相容）
        console.warn(`[Webhook] Unknown event: ${event}`);
    }

    return NextResponse.json({ success: true });

  } catch (e: unknown) {
    console.error("[Webhook] Error:", e);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
