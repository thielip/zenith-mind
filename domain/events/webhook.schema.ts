import { z } from "zod";

/** Webhook 入站契約 v1（向前相容：未知 event 仍 200 + warn） */
export const WebhookEnvelopeV1Schema = z.object({
  eventVersion: z.literal(1).optional().default(1),
  event: z.string().min(1).max(128),
  data: z.unknown().optional(),
});

export type WebhookEnvelopeV1 = z.infer<typeof WebhookEnvelopeV1Schema>;

export const KNOWN_WEBHOOK_EVENTS = [
  "POST_PUBLISHED",
  "AI_JOB_DONE",
] as const;

export type KnownWebhookEvent = (typeof KNOWN_WEBHOOK_EVENTS)[number];

export function isKnownWebhookEvent(event: string): event is KnownWebhookEvent {
  return (KNOWN_WEBHOOK_EVENTS as readonly string[]).includes(event);
}
