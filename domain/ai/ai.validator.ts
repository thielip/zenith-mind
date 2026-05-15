// domain/ai/ai.validator.ts
// 版本化 DTO Schema（z.literal(1) 強制版本控制）
// Validation 職責完全在 Domain Layer，AiPort 不負責

import { z } from "zod";

// ── AI Job 建立請求（版本化）────────────────────────────

export const CreateAiJobSchema = z.object({
  version:        z.literal(1),  // 強制版本校驗，防滾動更新格式不符
  type:           z.enum(["GENERATE_DRAFT", "OPTIMIZE_TITLE", "EXTRACT_FAQ"]),
  postId:         z.string().cuid(),
  idempotencyKey: z.string().min(16).max(128),
  options:        z.record(z.unknown()).optional(),
});

export type CreateAiJobInput = z.infer<typeof CreateAiJobSchema>;

// ── 草稿生成 Payload ────────────────────────────────────

export const GenerateDraftPayloadSchema = z.object({
  topic:          z.string().min(2).max(200),
  keywords:       z.array(z.string().max(50)).min(1).max(10),
  targetAudience: z.string().max(200),
  locale:         z.enum(["zh-TW", "en"]),
  wordCount:      z.number().int().min(500).max(5000).default(2000),
});

export type GenerateDraftPayload = z.infer<typeof GenerateDraftPayloadSchema>;

// ── 草稿生成 AI 回應驗證 ────────────────────────────────

export const DraftResultSchema = z.object({
  title:         z.string().min(5).max(200),
  excerpt:       z.string().min(10).max(300),
  content:       z.string().min(100),
  suggestedTags: z.array(z.string()).max(10),
});

export type DraftResult = z.infer<typeof DraftResultSchema>;

// ── 標題優化 Payload ────────────────────────────────────

export const OptimizeTitlePayloadSchema = z.object({
  currentTitle: z.string().min(5).max(200),
  focusKeyword: z.string().max(100),
  locale:       z.enum(["zh-TW", "en"]),
});

export type OptimizeTitlePayload = z.infer<typeof OptimizeTitlePayloadSchema>;

// ── FAQ 提取 Payload ────────────────────────────────────

export const ExtractFaqPayloadSchema = z.object({
  postId:         z.string().cuid(),
  articleContent: z.string().min(100),
  count:          z.number().int().min(3).max(10).default(5),
  locale:         z.enum(["zh-TW", "en"]),
});

export type ExtractFaqPayload = z.infer<typeof ExtractFaqPayloadSchema>;

// ── AI Job Status 查詢回應 ──────────────────────────────

export const AiJobStatusSchema = z.object({
  id:          z.string(),
  status:      z.enum(["PENDING", "PROCESSING", "DONE", "FAILED", "DEAD_LETTER"]),
  stepIndex:   z.number(),
  retryCount:  z.number(),
  result:      z.unknown().nullable(),
  failedReason: z.unknown().nullable(),
  createdAt:   z.string(),
  updatedAt:   z.string(),
});

export type AiJobStatus = z.infer<typeof AiJobStatusSchema>;
