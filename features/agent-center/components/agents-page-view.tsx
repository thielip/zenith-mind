"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  Zap,
} from "lucide-react";
import {
  cancelAgentJobAction,
  clearPendingAgentQueueAction,
  prioritizeAgentJobAction,
  recoverStuckAgentJobsAction,
} from "@/actions/agent-queue.actions";
import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { TerminalPanel } from "@/widgets/terminal-stream/terminal-panel";
import { GlassCard } from "@/shared/ui/glass-card";
import { Badge } from "@/shared/ui/badge";
import { useRealtimeStream } from "@/hooks/use-realtime-stream";
import type { AgentPayload } from "@/types/command-center/module-payloads";
import type { KpiMetric } from "@/types/command-center/metrics";
import { cn } from "@/shared/lib/cn";

const REFRESH_MS = 5000;

function kpiValueClass(metric: KpiMetric): string {
  if (metric.id === "processing" && metric.value > 0) {
    return "text-[#00F2FE] drop-shadow-[0_0_12px_rgba(0,242,254,0.35)]";
  }
  if (metric.status === "critical") return "text-red-400";
  if (metric.status === "warn") return "text-amber-300";
  return "text-white";
}

function AgentKpiCard({ metric }: { metric: KpiMetric }) {
  const live = metric.id === "processing" && metric.value > 0;

  return (
    <GlassCard
      glow={
        metric.status === "critical"
          ? "red"
          : metric.status === "warn"
            ? "amber"
            : live
              ? "cyan"
              : "cyan"
      }
      className="relative overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-slate-400">{metric.label}</p>
        {live ? (
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" aria-hidden />
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {live ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#00F2FE]" aria-hidden />
        ) : null}
        <p
          className={cn(
            "font-mono text-4xl font-bold tabular-nums tracking-tight",
            kpiValueClass(metric)
          )}
        >
          {metric.value.toLocaleString()}
        </p>
      </div>
      {metric.aiNote ? (
        <p className="mt-2 text-[10px] text-slate-500">{metric.aiNote}</p>
      ) : null}
    </GlassCard>
  );
}

function statusBadgeVariant(
  status: string
): "ok" | "warn" | "default" | "cyan" {
  if (status === "PROCESSING") return "cyan";
  if (status === "PENDING") return "warn";
  if (status === "DONE") return "ok";
  return "default";
}

export function AgentsPageView({ data }: { data: AgentPayload }) {
  useRealtimeStream();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const [logsOpen, setLogsOpen] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    startTransition(() => router.refresh());
    setCountdown(REFRESH_MS / 1000);
  }, [router, startTransition]);

  useEffect(() => {
    if (!autoRefresh) return;
    const tick = window.setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [autoRefresh]);

  useEffect(() => {
    if (!autoRefresh || countdown !== 0) return;
    refresh();
  }, [autoRefresh, countdown, refresh]);

  const runAction = async (fn: () => Promise<{ success: boolean }>) => {
    setMessage(null);
    const res = await fn();
    if (res.success) {
      refresh();
      setMessage("操作已套用");
    } else {
      setMessage("操作失敗，請確認權限或任務狀態");
    }
  };

  const busyAgents = data.nodes.filter((n) => n.status === "running").length;

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <ModuleHeader
          title="Agent 中控"
          description="AI Agent 管線、佇列與自動化狀態 — 即時監控與緊急操作"
        />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-600"
            />
            每 5 秒自動重新整理
            {autoRefresh ? (
              <span className="font-mono text-cyan-300">{countdown}s</span>
            ) : null}
          </label>
          <button
            type="button"
            onClick={refresh}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
            立即更新
          </button>
          <button
            type="button"
            onClick={() =>
              runAction(async () => {
                const r = await recoverStuckAgentJobsAction();
                return { success: r.success };
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-800/60 bg-cyan-950/40 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-900/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            回收逾時
          </button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("確定清空所有「等待中」任務？此操作無法復原。")) return;
              runAction(async () => {
                const r = await clearPendingAgentQueueAction();
                return { success: r.success };
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-xs text-red-200 hover:bg-red-900/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清空佇列
          </button>
        </div>
      </div>

      {autoRefresh ? (
        <div
          className="h-0.5 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuenow={countdown}
          aria-valuemin={0}
          aria-valuemax={REFRESH_MS / 1000}
        >
          <div
            className="h-full bg-cyan-500/80 transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / (REFRESH_MS / 1000)) * 100}%` }}
          />
        </div>
      ) : null}

      {message ? (
        <p className="text-xs text-emerald-300/90" role="status">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((k) => (
          <AgentKpiCard key={k.id} metric={k} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-slate-800/80 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">任務佇列</h2>
            <p className="text-[11px] text-slate-500">
              顯示最近 50 筆 · 可依狀態取消或插隊
            </p>
          </div>
          {data.queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <p className="text-sm text-emerald-200/90">
                目前沒有排隊中的任務，運作良好！
              </p>
              <p className="text-xs text-slate-500">
                從文章編輯器觸發 AI 草稿、標題優化或 FAQ 擷取後，任務會出現於此。
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="bg-slate-900/60 text-left text-slate-500">
                    <th className="px-4 py-2 font-medium">任務</th>
                    <th className="px-4 py-2 font-medium">Agent</th>
                    <th className="px-4 py-2 font-medium">觸發時間</th>
                    <th className="px-4 py-2 font-medium">狀態</th>
                    <th className="px-4 py-2 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.queue.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-slate-800/60 hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-200">{row.typeLabel}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                          {row.id.slice(0, 12)}…
                          {row.postTitle ? ` · ${row.postTitle}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{row.agentLabel}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {new Date(row.createdAt).toLocaleString("zh-TW", {
                          hour: "2-digit",
                          minute: "2-digit",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                        {row.retryCount > 0 ? (
                          <span className="ml-1 text-amber-400">
                            重試 {row.retryCount}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariant(row.status)}>
                          {row.statusLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {row.status === "PENDING" ? (
                            <button
                              type="button"
                              title="優先執行（插隊）"
                              onClick={() =>
                                runAction(async () => {
                                  const r = await prioritizeAgentJobAction(row.id);
                                  return { success: r.success };
                                })
                              }
                              className="rounded p-1.5 text-cyan-300 hover:bg-cyan-500/10"
                            >
                              <Zap className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          {row.status === "PENDING" || row.status === "PROCESSING" ? (
                            <button
                              type="button"
                              title="取消任務"
                              onClick={() =>
                                runAction(async () => {
                                  const r = await cancelAgentJobAction(row.id);
                                  return { success: r.success };
                                })
                              }
                              className="rounded p-1.5 text-red-300 hover:bg-red-500/10"
                            >
                              <Pause className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Agent 效能監控</h2>
            <ul className="space-y-3 text-xs">
              {data.nodes.map((node) => (
                <li key={node.id} className="flex items-center justify-between gap-2">
                  <span className="text-slate-300">{node.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500">{node.successRate}%</span>
                    <Badge
                      variant={
                        node.status === "running"
                          ? "cyan"
                          : node.status === "done"
                            ? "ok"
                            : "default"
                      }
                    >
                      {node.status === "running" ? (
                        <span className="inline-flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          忙碌
                        </span>
                      ) : (
                        "閒置"
                      )}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-slate-800/80 pt-3 text-[10px] text-slate-500">
              執行中節點：{busyAgents} / {data.nodes.length}
              {data.queue.some((q) => q.lockedBy) ? (
                <span className="mt-1 block font-mono text-slate-600">
                  Worker: {data.queue.find((q) => q.lockedBy)?.lockedBy}
                </span>
              ) : null}
            </p>
          </GlassCard>

          <GlassCard className="border-amber-500/20 p-4">
            <div className="flex items-start gap-2 text-amber-200/90">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="text-[11px] leading-relaxed">
                <p className="font-medium text-amber-100">緊急操作說明</p>
                <p className="mt-1 text-amber-200/80">
                  「清空佇列」僅終止等待中任務；執行中請先「取消」或「回收逾時」。Worker 需{" "}
                  <code className="text-amber-100/90">/api/ai/worker</code> 與 CRON 正常運作。
                </p>
                <Link
                  href="/admin/dashboard/integrations"
                  className="mt-2 inline-block text-cyan-400 hover:underline"
                >
                  外部串接設定 →
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setLogsOpen((v) => !v)}
          className="mb-2 text-xs text-slate-400 hover:text-white"
        >
          {logsOpen ? "▼" : "▶"} 即時系統日誌
        </button>
        {logsOpen ? <TerminalPanel /> : null}
      </div>
    </div>
  );
}
