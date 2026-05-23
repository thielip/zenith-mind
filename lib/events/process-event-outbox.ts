import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/infrastructure/db/prisma";
import { logger } from "@/lib/logger";
import { sendAlertEmail } from "@/lib/alert/send-alert-email";

const BATCH_SIZE = 50;

export async function processEventOutbox(): Promise<number> {
  const events = await prisma.eventOutbox.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
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
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    } catch (e: unknown) {
      await prisma.eventOutbox.update({
        where: { id: event.id },
        data: { status: "FAILED", error: String(e) },
      });
    }
  }

  return events.length;
}
