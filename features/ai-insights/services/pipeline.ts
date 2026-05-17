import type { AiInsight } from "@/types/command-center/insights";
import { collectInsightSignals } from "./collectors";
import { detectSignals } from "./signal-detectors";
import { generateGeminiInsight } from "./gemini-generator";

export async function runInsightPipeline(): Promise<AiInsight[]> {
  const signals = await collectInsightSignals();
  const ruleInsights = detectSignals(signals);
  const geminiInsight = await generateGeminiInsight(signals, ruleInsights);

  const merged = geminiInsight
    ? [geminiInsight, ...ruleInsights]
    : ruleInsights;

  return merged.slice(0, 12);
}
