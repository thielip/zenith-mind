import OpenAI from "openai";
import { z } from "zod";
import type { AiInsight } from "@/types/command-center/insights";
import type { CollectedSignals } from "./collectors";

const GEMINI_COMPAT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/";

const geminiInsightSchema = z.object({
  title: z.string(),
  summary: z.string(),
  rootCause: z.string(),
  impact: z.string(),
  remediation: z.string(),
  riskTier: z.enum(["info", "watch", "high", "critical"]),
  predictedOutcome: z.string(),
});

export async function generateGeminiInsight(
  signals: CollectedSignals,
  ruleInsights: AiInsight[]
): Promise<AiInsight | null> {
  const apiKey = process.env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) return null;

  const client = new OpenAI({
    apiKey,
    baseURL: GEMINI_COMPAT_BASE_URL,
  });

  const prompt = `你是 AI 行銷作戰中心的分析官。根據以下即時信號產出 1 則繁體中文洞察（JSON）。
信號: ${JSON.stringify(signals)}
既有規則洞察數: ${ruleInsights.length}
輸出 JSON 欄位: title, summary, rootCause, impact, remediation, riskTier, predictedOutcome`;

  try {
    const completion = await client.chat.completions.create({
      model: "gemini-3.1-flash-lite-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = geminiInsightSchema.parse(JSON.parse(raw));
    return {
      id: `gemini-${Date.now()}`,
      ...parsed,
      source: "gemini",
      createdAt: new Date().toISOString(),
      tags: ["ai-generated"],
      autoFixAvailable: false,
    };
  } catch {
    return null;
  }
}
