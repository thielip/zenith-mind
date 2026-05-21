"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { ModuleHeader } from "@/widgets/command-shell/module-header";
import { GlassCard } from "@/shared/ui/glass-card";
import { IntegrationStatusBadge } from "@/components/admin/IntegrationStatusBadge";
import {
  categoryLabel,
  groupIntegrationsByCategory,
  integrationCategory,
  type IntegrationCategory,
} from "@/lib/admin/integration-groups";
import type { SecurityPayload } from "@/server/command-center/load-security";
import { cn } from "@/shared/lib/cn";

const TABS: IntegrationCategory[] = ["core", "security", "google", "other"];

function SecurityKpiCard({
  label,
  value,
  status,
  aiNote,
  href,
}: {
  label: string;
  value: number;
  status: "ok" | "warn" | "critical";
  aiNote?: string;
  href?: string;
}) {
  const glow =
    status === "critical" ? "red" : status === "warn" ? "amber" : "cyan";
  const valueClass =
    status === "critical"
      ? "text-red-400"
      : status === "warn"
        ? "text-amber-300"
        : "text-white";

  return (
    <GlassCard glow={glow} className="relative p-4">
      {href ? (
        <Link
          href={href}
          className="absolute right-3 top-3 text-slate-500 hover:text-cyan-300"
          aria-label={`前往 ${label}`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      ) : null}
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn("mt-2 font-mono text-4xl font-bold tabular-nums", valueClass)}>
        {value.toLocaleString()}
      </p>
      {aiNote ? (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{aiNote}</p>
      ) : null}
    </GlassCard>
  );
}

export function SecurityPageView({ data }: { data: SecurityPayload }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<IntegrationCategory | "all">("all");

  const grouped = useMemo(
    () => groupIntegrationsByCategory(
      data.integrations.map((i) => ({
        ...i,
        description: i.description,
        missing: i.missing,
      }))
    ),
    [data.integrations]
  );

  const visibleItems = useMemo(() => {
    if (tab === "all") return data.integrations;
    return grouped[tab];
  }, [tab, data.integrations, grouped]);

  const refresh = useCallback(async () => {
    try {
      await fetch("/api/admin/integrations/refresh-health", { method: "POST" });
    } catch {
      /* 仍觸發頁面 refresh */
    }
    startTransition(() => router.refresh());
  }, [router, startTransition]);

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <ModuleHeader
          title="安全中心"
          description="憑證、串接健康與 BigQuery — 最後檢查"
        />
        <button
          type="button"
          onClick={refresh}
          disabled={pending}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
          重新偵測
        </button>
      </div>

      <p className="text-[11px] text-slate-500">
        檢查時間：{new Date(data.checkedAt).toLocaleString("zh-TW")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SecurityKpiCard
          label="正常串接"
          value={data.summary.ok}
          status="ok"
        />
        <SecurityKpiCard
          label="缺漏設定"
          value={data.summary.missing}
          status={data.summary.missing > 0 ? "warn" : "ok"}
          href="/admin/dashboard/errors"
        />
        <SecurityKpiCard
          label="異常服務"
          value={data.summary.error}
          status={data.summary.error > 0 ? "critical" : "ok"}
          href="/admin/dashboard/errors"
        />
        <SecurityKpiCard
          label="BigQuery"
          value={data.kpis.find((k) => k.id === "bq")?.value ?? 0}
          status={
            (data.kpis.find((k) => k.id === "bq")?.status as "ok" | "warn") ??
            "ok"
          }
          aiNote={data.kpis.find((k) => k.id === "bq")?.aiNote}
          href="/admin/dashboard/integrations"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        <GlassCard className="overflow-hidden p-0">
          <div className="flex flex-wrap gap-2 border-b border-slate-800/80 px-4 py-3">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-medium",
                tab === "all"
                  ? "bg-cyan-500/20 text-cyan-100"
                  : "text-slate-400 hover:text-white"
              )}
            >
              全部
            </button>
            {TABS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setTab(cat)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium",
                  tab === cat
                    ? "bg-cyan-500/20 text-cyan-100"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="bg-slate-900/50 text-left text-slate-500">
                  <th className="px-4 py-2 font-medium">串接服務</th>
                  <th className="px-4 py-2 font-medium">說明</th>
                  <th className="px-4 py-2 font-medium">分類</th>
                  <th className="px-4 py-2 font-medium">狀態</th>
                  <th className="px-4 py-2 font-medium">備註</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    id={`integration-${item.id}`}
                    className="border-t border-slate-800/50 hover:bg-slate-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {item.name}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-slate-500">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {categoryLabel(integrationCategory(item.id))}
                    </td>
                    <td className="px-4 py-3">
                      <IntegrationStatusBadge status={item.status} />
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-400">
                      {item.detail ??
                        (item.missing.length > 0
                          ? `缺少：${item.missing.join(", ")}`
                          : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard className="p-4" glow="amber">
          <h2 className="text-sm font-semibold text-white">系統健檢診斷</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            偵測到 {data.summary.missing + data.summary.error} 項需留意
          </p>
          <ul className="mt-4 space-y-2 text-xs text-slate-300">
            {data.diagnostics.length > 0 ? (
              data.diagnostics.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-amber-400">•</span>
                  <span>{line}</span>
                </li>
              ))
            ) : (
              <li className="text-emerald-300">所有核心串接正常。</li>
            )}
          </ul>
          <Link
            href="/admin/dashboard/integrations"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:underline"
          >
            前往串接設定
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}
