import type { CollectedSignals } from "./collectors";
import type { AiInsight } from "@/types/command-center/insights";

export function detectSignals(data: CollectedSignals): AiInsight[] {
  const insights: AiInsight[] = [];
  const now = new Date().toISOString();

  if (!data.ga4Ok) {
    insights.push({
      id: "ga4-disconnect",
      title: "GA4 Reporting API 異常",
      summary: "即時與歷史報表無法取得，戰情指標可能失真。",
      rootCause: "服務帳號憑證、Property ID 或 API 權限異常。",
      impact: "全站流量 KPI、異常偵測與預測模型皆不可用。",
      remediation: "執行 sync-ga4-env.mjs，確認服務帳號已授權 Property 536903218，並重啟 dev server。",
      riskTier: "critical",
      predictedOutcome: "24 小時內無法掌握流量異常與 ROI 變化。",
      source: "signal-detector",
      createdAt: now,
      tags: ["ga4", "infra"],
      autoFixAvailable: false,
    });
  }

  if (data.pendingAiJobs >= 5) {
    insights.push({
      id: "ai-queue-backlog",
      title: "AI 任務佇列堆積",
      summary: `目前有 ${data.pendingAiJobs} 筆 PENDING 任務等待處理。`,
      rootCause: "Worker 未執行、Cron 未觸發或 Redis Queue 阻塞。",
      impact: "內容產製與自動化發布延遲。",
      remediation: "檢查 /api/ai/worker 與 CRON_SECRET 排程。",
      riskTier: "high",
      predictedOutcome: "發布節奏落後 1–2 個工作天。",
      source: "signal-detector",
      createdAt: now,
      tags: ["agent", "queue"],
      autoFixAvailable: true,
    });
  }

  if (data.gscOk && data.gscImpressions > 0 && data.gscClicks / data.gscImpressions < 0.02) {
    insights.push({
      id: "ctr-dip",
      title: "自然搜尋 CTR 偏低",
      summary: `GSC 整體 CTR ${((data.gscClicks / data.gscImpressions) * 100).toFixed(2)}%，低於健康門檻 2%。`,
      rootCause: "Meta Title/Description 吸引力不足或 SERP 競品搶佔。",
      impact: "相同曝光下點擊與 Sessions 被壓縮。",
      remediation: "優先重寫 Top 10 查詢對應頁面的標題與描述。",
      riskTier: "watch",
      predictedOutcome: "若忽略，7 日內自然流量可能下滑 8–15%。",
      source: "signal-detector",
      createdAt: now,
      tags: ["seo", "ctr"],
      autoFixAvailable: false,
    });
  }

  return insights;
}
