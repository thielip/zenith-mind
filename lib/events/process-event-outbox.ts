import type { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/infrastructure/db/prisma";
import { logger } from "@/lib/logger";
import { sendAlertEmail } from "@/lib/alert/send-alert-email";
import {
  computeNextOutboxRetry,
  getOutboxRetryMeta,
  isOutboxReadyForProcessing,
  mergeOutboxPayloadWithRetry,
  stripOutboxMeta,
} from "@/lib/events/outbox-retry";

const BATCH_SIZE = 50;
const FETCH_MULTIPLIER = 3;

async function handleOutboxEvent(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  switch (eventType) {
    case "POST_PUBLISHED":
    case "AI_JOB_DONE":
      revalidateTag("posts");
      revalidatePath("/blog", "layout");
      break;

    case "AI_JOB_DEAD_LETTER": {
      const payloadText = JSON.stringify(payload, null, 2);
      logger.error("AI Job dead-letter alert", { meta: { payload } });
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
}

export async function processEventOutbox(): Promise<number> {
  const candidates = await prisma.eventOutbox.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE * FETCH_MULTIPLIER,
  });

  const events = candidates
    .filter((e) => isOutboxReadyForProcessing(e.payload))
    .slice(0, BATCH_SIZE);

  for (const event of events) {
    const businessPayload = stripOutboxMeta(event.payload);
    try {
      await handleOutboxEvent(event.eventType, businessPayload);

      await prisma.eventOutbox.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processedAt: new Date(), error: null },
      });
    } catch (e: unknown) {
      const errText = String(e);
      const prev = getOutboxRetryMeta(event.payload);
      const next = computeNextOutboxRetry(prev?.retryCount ?? 0);

      if (next.giveUp) {
        await prisma.eventOutbox.update({
          where: { id: event.id },
          data: { status: "FAILED", error: errText },
        });
        logger.error("Event outbox exhausted retries", {
          meta: { eventId: event.id, eventType: event.eventType, error: errText },
        });
      } else {
        await prisma.eventOutbox.update({
          where: { id: event.id },
          data: {
            status: "PENDING",
            error: errText,
            payload: mergeOutboxPayloadWithRetry(
              event.payload,
              next.meta,
              errText
            ) as Prisma.InputJsonValue,
          },
        });
        logger.warn("Event outbox scheduled cold retry", {
          meta: {
            eventId: event.id,
            retryCount: next.meta.retryCount,
            nextRetryAt: next.meta.nextRetryAt,
          },
        });
      }
    }
  }

  return events.length;
}
