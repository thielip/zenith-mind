// app/api/webhook/route.ts — Node Runtime
// Webhook 接收端：HMAC-SHA256 + Timestamp ±5分鐘 + Nonce Redis NX 防重放

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { consumeWebhookNonce } from "@/infrastructure/redis/webhook-nonce";
import { prisma } from "@/infrastructure/db/prisma";
import {
  isKnownWebhookEvent,
  WebhookEnvelopeV1Schema,
} from "@/domain/events/webhook.schema";
import { resolveClientIpFromHeaders } from "@/lib/request/client-ip";
import { checkRateLimit, rateLimitKeyIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = resolveClientIpFromHeaders(req.headers);
    const rl = await checkRateLimit(
      rateLimitKeyIp(ip, "webhook"),
      60,
      60
    );
    if (!rl.allowed) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    const signature = req.headers.get("x-webhook-signature") ?? "";
    const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
    const nonce = req.headers.get("x-webhook-nonce") ?? "";

    if (!signature || !timestamp || !nonce) {
      return NextResponse.json({ error: "MISSING_HEADERS" }, { status: 401 });
    }

    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
      return NextResponse.json({ error: "TIMESTAMP_EXPIRED" }, { status: 401 });
    }

    const rawBody = await req.text();

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

    const nonceOk = await consumeWebhookNonce(nonce);
    if (!nonceOk) {
      return NextResponse.json({ error: "NONCE_REPLAYED" }, { status: 401 });
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const envelope = WebhookEnvelopeV1Schema.safeParse(parsedBody);
    if (!envelope.success) {
      return NextResponse.json(
        { error: "INVALID_ENVELOPE", details: envelope.error.flatten() },
        { status: 400 }
      );
    }

    const { event, data } = envelope.data;

    if (isKnownWebhookEvent(event)) {
      await prisma.eventOutbox.create({
        data: { eventType: event, payload: data ?? {} },
      });
    } else {
      console.warn(`[Webhook] Unknown event: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("[Webhook] Error:", e);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
