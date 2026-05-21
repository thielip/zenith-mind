"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Download, RefreshCw, Search } from "lucide-react";
import AuditActionBadge from "@/components/admin/audit-log/AuditActionBadge";
import AuditLogDetailModal from "@/components/admin/audit-log/AuditLogDetailModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AuditLogOperator, AuditLogRow } from "@/lib/admin/load-audit-logs";
import {
  AUDIT_FILTER_ACTIONS,
  AUDIT_LOG_PER_PAGE_OPTIONS,
  buildAuditLogExportQuery,
  buildAuditLogListQuery,
  type AuditLogListParams,
  type AuditLogPerPage,
} from "@/lib/admin/audit-log-params";
import { cn } from "@/shared/lib/cn";

interface Props {
  logs: AuditLogRow[];
  total: number;
  page: number;
  perPage: AuditLogPerPage;
  totalPages: number;
  operators: AuditLogOperator[];
  params: AuditLogListParams;
}

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export default function AuditLogManager({
  logs,
  total,
  page,
  perPage,
  totalPages,
  operators,
  params,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [keyword, setKeyword] = useState(params.q);
  const [detailLog, setDetailLog] = useState<AuditLogRow | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [customFrom, setCustomFrom] = useState(params.from ?? "");
  const [customTo, setCustomTo] = useState(params.to ?? "");

  useEffect(() => {
    setKeyword(params.q);
    setCustomFrom(params.from ?? "");
    setCustomTo(params.to ?? "");
  }, [params.q, params.from, params.to]);

  const navigate = useCallback(
    (patch: Partial<AuditLogListParams>) => {
      const resetPage =
        patch.q !== undefined ||
        patch.action !== undefined ||
        patch.userId !== undefined ||
        patch.datePreset !== undefined ||
        patch.from !== undefined ||
        patch.to !== undefined ||
        patch.perPage !== undefined;

      const href = buildAuditLogListQuery(params, {
        ...patch,
        page: patch.page ?? (resetPage ? 1 : params.page),
      });
      startTransition(() => router.push(href));
    },
    [params, router]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (keyword === params.q) return;
      navigate({ q: keyword });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [keyword, params.q, navigate]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => router.refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [autoRefresh, router]);

  const paginationPages = useMemo(() => pageNumbers(page, totalPages), [page, totalPages]);
  const exportHref = buildAuditLogExportQuery(params);

  return (
    <TooltipProvider>
      <AuditLogDetailModal log={detailLog} onClose={() => setDetailLog(null)} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          第 {page} / {totalPages} 頁，共 {total.toLocaleString()} 筆紀錄
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600"
            />
            <RefreshCw size={14} className={autoRefresh ? "animate-spin text-blue-600" : ""} aria-hidden />
            自動重整（60 秒）
          </label>
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Download size={14} aria-hidden />
            匯出 CSV
          </a>
        </div>
      </div>

      <div className="mb-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: "all", label: "全部時間" },
              { value: "today", label: "今天" },
              { value: "last7", label: "過去 7 天" },
              { value: "custom", label: "自訂區間" },
            ] as const
          ).map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() =>
                navigate({
                  datePreset: preset.value,
                  from: preset.value === "custom" ? customFrom || null : null,
                  to: preset.value === "custom" ? customTo || null : null,
                })
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                params.datePreset === preset.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {params.datePreset === "custom" ? (
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-gray-600">
              起日
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-gray-600">
              迄日
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => navigate({ from: customFrom || null, to: customTo || null })}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              套用區間
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="block min-w-0 flex-1">
            <span className="mb-1 block text-xs font-semibold text-gray-600">
              關鍵字（Post ID、Request ID、對象、Email）
            </span>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜尋…"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </label>
          <label className="block w-full lg:w-52">
            <span className="mb-1 block text-xs font-semibold text-gray-600">操作者</span>
            <select
              value={params.userId ?? ""}
              onChange={(e) => navigate({ userId: e.target.value || null })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">全部管理員</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.email}
                </option>
              ))}
            </select>
          </label>
          <label className="block w-full lg:w-36">
            <span className="mb-1 block text-xs font-semibold text-gray-600">動作</span>
            <select
              value={params.action}
              onChange={(e) =>
                navigate({ action: e.target.value as AuditLogListParams["action"] })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {AUDIT_FILTER_ACTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {(params.q ||
            params.userId ||
            params.action !== "all" ||
            params.datePreset !== "all") && (
            <button
              type="button"
              onClick={() =>
                navigate({
                  q: "",
                  userId: null,
                  action: "all",
                  datePreset: "all",
                  from: null,
                  to: null,
                })
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              清除篩選
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm" aria-label="操作紀錄列表">
            <thead className="bg-gray-50">
              <tr>
                {["時間", "操作者", "動作", "對象", "IP", "Request ID", ""].map((h) => (
                  <th
                    key={h || "actions"}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="cursor-pointer hover:bg-blue-50/40"
                  onClick={() => setDetailLog(log)}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    <time dateTime={log.createdAt}>
                      {new Date(log.createdAt).toLocaleString("zh-TW")}
                    </time>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.userEmail ?? "系統"}</td>
                  <td className="px-4 py-3">
                    <AuditActionBadge action={log.action} />
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-3 text-gray-600" title={log.entityId ?? undefined}>
                    {log.entityType
                      ? `${log.entityType}${log.entityId ? ` (${log.entityId.slice(0, 10)}…)` : ""}`
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-700">
                    {log.ip ?? "—"}
                    {log.ipCountry ? (
                      <span className="ml-1 font-sans text-gray-500">({log.ipCountry})</span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                    {log.requestId?.slice(0, 12) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailLog(log);
                      }}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      詳情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">尚無符合條件的紀錄</div>
        )}

        <nav
          className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          aria-label="操作紀錄分頁"
        >
          <label className="flex items-center gap-2 text-sm text-gray-600">
            每頁
            <select
              value={perPage}
              onChange={(e) =>
                navigate({ perPage: Number(e.target.value) as AuditLogPerPage, page: 1 })
              }
              className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
            >
              {AUDIT_LOG_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} 筆
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-1">
            {page > 1 ? (
              <a
                href={buildAuditLogListQuery(params, { page: page - 1 })}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                上一頁
              </a>
            ) : (
              <span className="rounded-lg border border-gray-100 px-3 py-1.5 text-sm text-gray-300">
                上一頁
              </span>
            )}
            {paginationPages.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`e-${i}`} className="px-2 text-gray-400">
                  …
                </span>
              ) : (
                <a
                  key={p}
                  href={buildAuditLogListQuery(params, { page: p })}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(
                    "min-w-[2rem] rounded-lg border px-2.5 py-1.5 text-center text-sm",
                    p === page
                      ? "border-blue-600 bg-blue-600 font-semibold text-white"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {p}
                </a>
              )
            )}
            {page < totalPages ? (
              <a
                href={buildAuditLogListQuery(params, { page: page + 1 })}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                下一頁
              </a>
            ) : (
              <span className="rounded-lg border border-gray-100 px-3 py-1.5 text-sm text-gray-300">
                下一頁
              </span>
            )}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
