import { prisma } from "@/infrastructure/db/prisma";
import type { AgentPayload } from "@/types/command-center/module-payloads";

export type { AgentPayload };
import type { KpiMetric } from "@/types/command-center/metrics";

export async function loadAgentPayload(): Promise<AgentPayload> {
  const jobs = await prisma.aiJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, type: true, status: true, createdAt: true },
  });

  const pending = jobs.filter((j) => j.status === "PENDING").length;
  const processing = jobs.filter((j) => j.status === "PROCESSING").length;

  const kpis: KpiMetric[] = [
    {
      id: "pending",
      label: "等待中任務",
      value: pending,
      trend: pending > 0 ? "up" : "flat",
      sparkline: [pending],
      status: pending > 5 ? "warn" : "ok",
    },
    {
      id: "processing",
      label: "處理中",
      value: processing,
      trend: "flat",
      sparkline: [processing],
      status: "ok",
    },
  ];

  return {
    kpis,
    nodes: [
      { id: "ingest", label: "資料擷取", status: "done", successRate: 99 },
      {
        id: "analyze",
        label: "信號分析",
        status: processing > 0 ? "running" : "idle",
        successRate: 97,
      },
      {
        id: "insight",
        label: "洞察生成",
        status: pending > 0 ? "running" : "idle",
        successRate: 95,
      },
      { id: "publish", label: "自動發布", status: "idle", successRate: 92 },
    ],
    edges: [
      { from: "ingest", to: "analyze", active: processing > 0 },
      { from: "analyze", to: "insight", active: pending > 0 },
      { from: "insight", to: "publish", active: false },
    ],
    queue: jobs.map((j) => ({
      id: j.id,
      type: j.type,
      status: j.status,
      createdAt: j.createdAt.toISOString(),
    })),
  };
}
