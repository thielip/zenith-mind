import type { AiJobStatus, AiJobType } from "@prisma/client";

const JOB_TYPE_LABELS: Record<AiJobType, string> = {
  GENERATE_DRAFT: "GEO 情報生成 · 草稿",
  OPTIMIZE_TITLE: "標題優化",
  EXTRACT_FAQ: "FAQ 結構化擷取",
};

const AGENT_BY_TYPE: Record<AiJobType, string> = {
  GENERATE_DRAFT: "內容生成小幫手",
  OPTIMIZE_TITLE: "SEO 標題代理",
  EXTRACT_FAQ: "AEO / FAQ 代理",
};

const STATUS_LABELS: Record<AiJobStatus, string> = {
  PENDING: "等待中",
  PROCESSING: "執行中",
  DONE: "已完成",
  FAILED: "失敗",
  DEAD_LETTER: "已終止",
};

export function jobTypeLabel(type: AiJobType): string {
  return JOB_TYPE_LABELS[type] ?? type;
}

export function jobAgentLabel(type: AiJobType): string {
  return AGENT_BY_TYPE[type] ?? "通用 Agent";
}

export function jobStatusLabel(status: AiJobStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function kpiSeverityForQueueCount(count: number): "ok" | "warn" | "critical" {
  if (count > 50) return "critical";
  if (count > 10) return "warn";
  return "ok";
}
