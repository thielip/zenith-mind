import type { IntegrationHealthItem } from "@/lib/admin/integration-health.types";
import type { AiInsight } from "@/types/command-center/insights";

export interface WarRoomAlertContext {
  ga4Ok: boolean;
  ga4Message?: string;
  trafficSeriesLen: number;
  insights: AiInsight[];
  connections: IntegrationHealthItem[];
}

function geminiConnection(ctx: WarRoomAlertContext) {
  return ctx.connections.find((c) => c.id === "gemini");
}

function ga4Connection(ctx: WarRoomAlertContext) {
  return (
    ctx.connections.find((c) => c.id === "ga4-reporting") ??
    ctx.connections.find((c) => c.id === "ga4")
  );
}

/** 戰情室「資料連線提示」：區分 GA4、Gemini 與「無異常但洞察為空」 */
export function buildWarRoomDataAlerts(ctx: WarRoomAlertContext): string[] {
  const alerts: string[] = [];
  const ga4Conn = ga4Connection(ctx);
  const geminiConn = geminiConnection(ctx);

  if (!ctx.ga4Ok) {
    alerts.push(
      ctx.ga4Message ??
        (ga4Conn?.status === "missing"
          ? "GA4 尚未在「外部串接設定」啟用或缺少服務帳號憑證。"
          : "GA4 Reporting API 未連線，流量圖表無法載入。")
    );
  } else if (ctx.trafficSeriesLen === 0) {
    alerts.push("GA4 已連線，但近 30 天尚無流量資料（或資源為新站）。");
  }

  const ruleCount = ctx.insights.filter((i) => i.source !== "gemini").length;
  const geminiCount = ctx.insights.filter((i) => i.source === "gemini").length;

  if (ctx.insights.length === 0) {
    if (geminiConn?.status === "missing") {
      alerts.push(
        "AI 洞察為空：請至「外部串接設定」填入 GEMINI_API_KEY 並啟用 Gemini，或確認 Vercel / 本機環境變數已同步。"
      );
    } else if (geminiConn?.status === "error") {
      alerts.push(
        `Gemini 連線異常：${geminiConn.detail ?? "請檢查 API 金鑰是否有效、配額是否用盡。"}`
      );
    } else if (!ctx.ga4Ok) {
      alerts.push(
        "目前無法產生洞察：需先修復 GA4 連線，系統才能依流量與搜尋信號偵測異常。"
      );
    } else {
      alerts.push(
        "目前信號正常，尚無需警示的 AI 洞察。若要 Gemini 深度分析，請確認 GEMINI_API_KEY 已啟用；規則型洞察會在佇列堆積或 CTR 異常時自動出現。"
      );
    }
  } else if (geminiCount === 0 && ruleCount > 0 && geminiConn?.status === "missing") {
    alerts.push(
      `已顯示 ${ruleCount} 則規則型洞察；啟用 Gemini 可額外產生 AI 深度建議（「外部串接設定」→ Gemini）。`
    );
  }

  return alerts;
}
