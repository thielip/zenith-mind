"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, RefreshCw, Settings } from "lucide-react";
import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { GlassCard } from "@/shared/ui/glass-card";
import { IntegrationStatusBadge } from "@/components/admin/IntegrationStatusBadge";
import type { ErrorsPayload } from "@/server/command-center/load-errors";
import { cn } from "@/shared/lib/cn";

function ErrorKpiCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "critical" | "warn" | "ok";
}) {
  const glow =
    variant === "critical" ? "red" : variant === "warn" ? "amber" : "cyan";
  const valueClass =
    variant === "critical"
      ? "text-red-400"
      : variant === "warn"
        ? "text-amber-300"
        : "text-emerald-300";

  return (
    <GlassCard glow={glow} className="p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn("mt-2 font-mono text-4xl font-bold tabular-nums", valueClass)}>
        {value.toLocaleString()}
      </p>
    </GlassCard>
  );
}

export function ErrorsPageView({ data }: { data: ErrorsPayload }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [probeMsg, setProbeMsg] = useState<Record<string, string>>({});
  const [probing, setProbing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      await fetch("/api/admin/integrations/refresh-health", { method: "POST" });
    } catch {
      /* ignore */
    }
    startTransition(() => router.refresh());
  }, [router, startTransition]);

  const reprobe = async (id: string) => {
    setProbing(id);
    setProbeMsg((m) => ({ ...m, [id]: "檢測中…" }));
    try {
      const res = await fetch("/api/admin/integrations/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      setProbeMsg((m) => ({
        ...m,
        [id]: json.ok
          ? `✓ ${json.message ?? "正常"}`
          : `✗ ${json.message ?? json.error ?? "失敗"}`,
      }));
      if (json.ok) refresh();
    } catch {
      setProbeMsg((m) => ({ ...m, [id]: "✗ 網路錯誤" }));
    } finally {
      setProbing(null);
    }
  };

  const hasIssues = data.items.length > 0 || data.missingItems.length > 0;

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <ModuleHeader
          title="錯誤追蹤"
          description="串接異常與缺漏設定 — 支援單項重新檢測"
        />
        <button
          type="button"
          onClick={refresh}
          disabled={pending}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
          重新偵測全部
        </button>
      </div>

      <p className="text-[11px] text-slate-500">
        最後檢查：{new Date(data.checkedAt).toLocaleString("zh-TW")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <ErrorKpiCard
          label="異常服務"
          value={data.kpis.find((k) => k.id === "errors")?.value ?? 0}
          variant={
            (data.kpis.find((k) => k.id === "errors")?.value ?? 0) > 0
              ? "critical"
              : "ok"
          }
        />
        <ErrorKpiCard
          label="缺漏設定"
          value={data.kpis.find((k) => k.id === "missing")?.value ?? 0}
          variant={
            (data.kpis.find((k) => k.id === "missing")?.value ?? 0) > 0
              ? "warn"
              : "ok"
          }
        />
      </div>

      {!hasIssues ? (
        <GlassCard className="p-8 text-center" glow="cyan">
          <p className="text-emerald-300">目前無異常服務，系統串接健康。</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-900/50 text-left text-slate-500">
                <th className="px-4 py-2 w-8" />
                <th className="px-4 py-2 font-medium">服務</th>
                <th className="px-4 py-2 font-medium">錯誤類型</th>
                <th className="px-4 py-2 font-medium">狀態</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const open = expanded === item.id;
                const isTimeout = item.detail?.includes("逾時");
                return (
                  <Fragment key={item.id}>
                    <tr
                      className="border-t border-slate-800/50 hover:bg-slate-800/20"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : item.id)}
                          className="text-slate-500 hover:text-white"
                          aria-expanded={open}
                        >
                          {open ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {item.service}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {isTimeout ? "探測逾時 (Timeout)" : item.detail ?? "連線錯誤"}
                      </td>
                      <td className="px-4 py-3">
                        <IntegrationStatusBadge status="error" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={probing === item.id}
                            onClick={() => reprobe(item.id)}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                          >
                            重新檢測
                          </button>
                          <Link
                            href="/admin/dashboard/integrations"
                            className="inline-flex items-center gap-1 rounded-lg border border-cyan-800/50 bg-cyan-950/40 px-2 py-1 text-[10px] text-cyan-200 hover:bg-cyan-900/40"
                          >
                            <Settings className="h-3 w-3" />
                            前往修復
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-t border-slate-800/30 bg-black/30">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="whitespace-pre-wrap font-mono text-[11px] text-red-200/90">
                            {probeMsg[item.id] ?? item.detail ?? "無詳細日誌"}
                          </pre>
                          {item.service.includes("Gemini") ? (
                            <p className="mt-2 text-[10px] text-slate-500">
                              排查：確認 API Key、Google AI Studio 配額、部署節點能否連線
                              generativelanguage.googleapis.com（必要時設定 Proxy）。
                              探測逾時已放寬至 25 秒。
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {data.missingItems.map((item) => (
                <tr
                  key={`missing-${item.id}`}
                  className="border-t border-slate-800/50 hover:bg-slate-800/20"
                >
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-slate-200">{item.service}</td>
                  <td className="px-4 py-3 text-slate-400">
                    缺少環境變數：{item.missing.join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <IntegrationStatusBadge status="missing" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href="/admin/dashboard/integrations"
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      前往修復
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}
