// domain/ai/ai.orchestrator.ts — Node Runtime
// Stateful Pipeline：Checkpoint 恢復 + Self-Correction + Token Budget 熔斷

import type { AiPort } from "@/domain/ai/ai.port";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";
import {
  DraftResultSchema,
  type GenerateDraftPayload,
  type DraftResult,
} from "@/domain/ai/ai.validator";
import { prisma } from "@/infrastructure/db/prisma";
import { logger } from "@/lib/logger";

// ── Token Budget 熔斷矩陣 ─────────────────────────────────

const TOKEN_BUDGET = {
  DAILY_LIMIT:     100_000,
  WARN_THRESHOLD:  0.8,    // 80% → 告警
  DOWNGRADE_AT:    0.9,    // 90% → 降級小模型
  CIRCUIT_BREAK:   1.0,    // 100% → 熔斷
  FALLBACK_MODEL: "gpt-4o-mini",
  PRIMARY_MODEL:  "gpt-4o",
} as const;

async function getDailyTokenUsage(): Promise<number> {
  // 從 DB 取今日 AI Job 總 Token 用量
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.aiJob.aggregate({
    _sum: { stepIndex: true }, // stepIndex 借用為 token 計數器（後續可改為獨立欄位）
    where: {
      status: { in: ["DONE", "PROCESSING"] },
      createdAt: { gte: today },
    },
  });

  return result._sum.stepIndex ?? 0;
}

function selectModel(usageRatio: number): string {
  if (usageRatio >= TOKEN_BUDGET.DOWNGRADE_AT) return TOKEN_BUDGET.FALLBACK_MODEL;
  return TOKEN_BUDGET.PRIMARY_MODEL;
}

// ── Self-Correction 迴路 ──────────────────────────────────

interface CorrectionContext {
  originalPrompt: string;
  badResponse:    string;
  parseError:     string;
}

function buildCorrectionPrompt(ctx: CorrectionContext): string {
  return `
你的上一個回應格式不符合要求。

原始指令：
${ctx.originalPrompt}

你的回應（有問題）：
${ctx.badResponse.slice(0, 500)}

錯誤原因：${ctx.parseError}

請重新回應，必須是符合指定格式的純 JSON，不加任何 markdown code block。
`.trim();
}

// ── 主 Orchestrator ───────────────────────────────────────

export class AiOrchestrator {
  constructor(private readonly ai: AiPort) {}

  /**
   * 生成文章草稿（含 Checkpoint 恢復）
   * @param jobId    - AI Job DB ID（Checkpoint 寫入用）
   * @param payload  - 生成參數
   * @param stepIndex - 上次中斷的步驟（0 = 從頭開始）
   */
  async generateDraft(
    jobId:      string,
    payload:    GenerateDraftPayload,
    stepIndex:  number = 0
  ): Promise<ActionResult<DraftResult>> {
    const requestId = crypto.randomUUID();

    // ── Token Budget 熔斷檢查 ────────────────────────────
    const dailyUsage    = await getDailyTokenUsage();
    const usageRatio    = dailyUsage / TOKEN_BUDGET.DAILY_LIMIT;

    if (usageRatio >= TOKEN_BUDGET.CIRCUIT_BREAK) {
      logger.error("Token budget circuit breaker triggered", { requestId, jobId, usageRatio });
      return { success: false, data: null, error: Errors.aiRateLimit() };
    }

    if (usageRatio >= TOKEN_BUDGET.WARN_THRESHOLD) {
      logger.warn("Token budget approaching limit", { requestId, jobId, usageRatio });
    }

    const model = selectModel(usageRatio);

    // ── Step 0：已完成（Checkpoint 跳過）────────────────
    if (stepIndex > 0) {
      logger.info("Resuming from checkpoint", { requestId, jobId, stepIndex });
    }

    // ── Step 1：組裝 Prompt ───────────────────────────────
    const prompt = this.buildDraftPrompt(payload);

    // Checkpoint：記錄開始執行 Step 1
    await this.saveCheckpoint(jobId, 1, null);

    // ── Step 2：呼叫 AI ───────────────────────────────────
    const aiResult = await this.ai.generate(prompt, {
      model,
      jsonMode:    true,
      temperature: 0.7,
      maxTokens:   4000,
    });

    if (!aiResult.success) return aiResult;

    // Checkpoint：AI 呼叫成功，記錄 Step 2
    await this.saveCheckpoint(jobId, 2, { rawResponse: aiResult.data.text });

    // ── Step 3：格式驗證 + Self-Correction ───────────────
    let parsed = this.parseAndValidate(aiResult.data.text);

    if (!parsed.success) {
      logger.warn("AI format error, attempting self-correction", {
        requestId, jobId, parseError: parsed.error,
      });

      // Self-Correction：帶錯重試一次
      const correctionPrompt = buildCorrectionPrompt({
        originalPrompt: prompt,
        badResponse:    aiResult.data.text,
        parseError:     parsed.error,
      });

      const retryResult = await this.ai.generate(correctionPrompt, {
        model,
        jsonMode:    true,
        temperature: 0.3, // 降低隨機性，提高格式準確率
        maxTokens:   4000,
      });

      if (!retryResult.success) return retryResult;

      parsed = this.parseAndValidate(retryResult.data.text);

      if (!parsed.success) {
        // 二次失敗 → FATAL，不再重試
        logger.error("Self-correction failed", { requestId, jobId });
        return { success: false, data: null, error: Errors.aiFormat() };
      }
    }

    // Checkpoint：驗證通過，記錄 Step 3（完成）
    await this.saveCheckpoint(jobId, 3, parsed.data);

    logger.info("Draft generated successfully", { requestId, jobId, model });
    return { success: true, data: parsed.data, error: null };
  }

  // ── Prompt 模板（版控在 domain 層，不接受 User 注入）───

  private buildDraftPrompt(p: GenerateDraftPayload): string {
    return `
你是「巔峰思維（Zenith Mind）」個人品牌的專業內容作者。

請針對以下主題，生成一篇完整的 SEO 導向部落格文章草稿：

主題：${p.topic}
目標關鍵字：${p.keywords.join("、")}
目標讀者：${p.targetAudience}
語言：${p.locale === "zh-TW" ? "繁體中文" : "英文"}
建議字數：${p.wordCount} 字

回傳格式（純 JSON，不加 markdown code block）：
{
  "title": "SEO 優化的文章標題（包含主要關鍵字）",
  "excerpt": "150 字內的摘要，用於列表頁顯示",
  "content": "Markdown 格式的完整文章內容",
  "suggestedTags": ["標籤1", "標籤2"]
}
`.trim();
  }

  private parseAndValidate(
    raw: string
  ): { success: true; data: DraftResult } | { success: false; error: string } {
    try {
      const json = JSON.parse(raw.replace(/```json|```/g, "").trim()) as unknown;
      const result = DraftResultSchema.safeParse(json);
      if (result.success) return { success: true,  data: result.data };
      return { success: false, error: result.error.message };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : "JSON parse error" };
    }
  }

  private async saveCheckpoint(
    jobId:         string,
    stepIndex:     number,
    partialResult: unknown
  ): Promise<void> {
    await prisma.aiJob.update({
      where: { id: jobId },
      data:  {
        stepIndex,
        partialResult: partialResult ?? undefined,
        updatedAt:     new Date(),
      },
    });
  }
}
