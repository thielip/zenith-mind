import { z } from "zod";

export const insightRiskTierSchema = z.enum([
  "info",
  "watch",
  "high",
  "critical",
]);

export const aiInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  rootCause: z.string(),
  impact: z.string(),
  remediation: z.string(),
  riskTier: insightRiskTierSchema,
  predictedOutcome: z.string(),
  source: z.string(),
  createdAt: z.string(),
  tags: z.array(z.string()),
  autoFixAvailable: z.boolean().default(false),
});

export type AiInsight = z.infer<typeof aiInsightSchema>;

export const insightStreamChunkSchema = z.object({
  insightId: z.string(),
  text: z.string(),
  done: z.boolean(),
});

export type InsightStreamChunk = z.infer<typeof insightStreamChunkSchema>;
