import { prisma } from "@/infrastructure/db/prisma";
import {
  jobAgentLabel,
  jobStatusLabel,
  jobTypeLabel,
  kpiSeverityForQueueCount,
} from "@/lib/admin/agent-queue-labels";
import type { AgentPayload } from "@/types/command-center/module-payloads";
import type { KpiMetric } from "@/types/command-center/metrics";

export type { AgentPayload };

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function loadAgentPayload(): Promise<AgentPayload> {
  const todayStart = startOfTodayUtc();

  const [jobs, pendingCount, processingCount, doneToday, failedToday] =
    await Promise.all([
      prisma.aiJob.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        take: 50,
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          startedAt: true,
          retryCount: true,
          lockedBy: true,
          post: { select: { title: true } },
        },
      }),
      prisma.aiJob.count({ where: { status: "PENDING" } }),
      prisma.aiJob.count({ where: { status: "PROCESSING" } }),
      prisma.aiJob.count({
        where: { status: "DONE", updatedAt: { gte: todayStart } },
      }),
      prisma.aiJob.count({
        where: {
          status: { in: ["DEAD_LETTER", "FAILED"] },
          updatedAt: { gte: todayStart },
        },
      }),
    ]);

  const kpis: KpiMetric[] = [
    {
      id: "pending",
      label: "等待中任務",
      value: pendingCount,
      trend: pendingCount > 0 ? "up" : "flat",
      sparkline: [pendingCount],
      status: kpiSeverityForQueueCount(pendingCount),
      aiNote: pendingCount > 10 ? "佇列偏高，建議檢查 Worker" : undefined,
    },
    {
      id: "processing",
      label: "處理中",
      value: processingCount,
      trend: processingCount > 0 ? "up" : "flat",
      sparkline: [processingCount],
      status: processingCount > 0 ? "ok" : "ok",
      aiNote: processingCount > 0 ? "系統運作中" : undefined,
    },
    {
      id: "done-today",
      label: "今日已完成",
      value: doneToday,
      trend: doneToday > 0 ? "up" : "flat",
      sparkline: [doneToday],
      status: "ok",
    },
    {
      id: "failed-today",
      label: "今日失敗",
      value: failedToday,
      trend: failedToday > 0 ? "up" : "flat",
      sparkline: [failedToday],
      status: failedToday > 0 ? "warn" : "ok",
    },
  ];

  const nodes: AgentPayload["nodes"] = [
    { id: "ingest", label: "資料擷取", status: "done", successRate: 99 },
    {
      id: "analyze",
      label: "信號分析",
      status: processingCount > 0 ? "running" : "idle",
      successRate: 97,
    },
    {
      id: "insight",
      label: "洞察生成",
      status: pendingCount > 0 ? "running" : "idle",
      successRate: 95,
    },
    {
      id: "publish",
      label: "自動發布",
      status: doneToday > 0 ? "done" : "idle",
      successRate: 92,
    },
  ];

  return {
    kpis,
    nodes,
    edges: [
      { from: "ingest", to: "analyze", active: processingCount > 0 },
      { from: "analyze", to: "insight", active: pendingCount > 0 },
      { from: "insight", to: "publish", active: doneToday > 0 },
    ],
    queue: jobs.map((j) => ({
      id: j.id,
      type: j.type,
      typeLabel: jobTypeLabel(j.type),
      agentLabel: jobAgentLabel(j.type),
      status: j.status,
      statusLabel: jobStatusLabel(j.status),
      createdAt: j.createdAt.toISOString(),
      startedAt: j.startedAt?.toISOString() ?? null,
      retryCount: j.retryCount,
      postTitle: j.post?.title ?? null,
      lockedBy: j.lockedBy,
    })),
  };
}
