"use client";

import type { AuditLogRow } from "@/lib/admin/load-audit-logs";

interface AuditLogDetailModalProps {
  log: AuditLogRow | null;
  onClose: () => void;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function extractChanges(metadata: unknown): Record<string, { before: unknown; after: unknown }> | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  if (m.changes && typeof m.changes === "object") {
    return m.changes as Record<string, { before: unknown; after: unknown }>;
  }
  return null;
}

export default function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  if (!log) return null;

  const changes = extractChanges(log.metadata);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="audit-detail-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 id="audit-detail-title" className="text-lg font-bold text-gray-900">
            操作詳情
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(log.createdAt).toLocaleString("zh-TW")} · {log.userEmail ?? "系統"}
          </p>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-4">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-gray-500">動作</dt>
              <dd className="text-gray-900">{log.action}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500">對象</dt>
              <dd className="font-mono text-xs text-gray-800">
                {log.entityType ?? "—"}
                {log.entityId ? ` · ${log.entityId}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500">IP</dt>
              <dd className="font-mono text-xs text-gray-800">
                {log.ip ?? "—"}
                {log.ipCountry ? ` (${log.ipCountry})` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-500">Request ID</dt>
              <dd className="break-all font-mono text-xs text-gray-800">
                {log.requestId ?? "—"}
              </dd>
            </div>
          </dl>

          {changes ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-800">欄位變更</h3>
              <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                {Object.entries(changes).map(([field, change]) => (
                  <div key={field} className="rounded-lg border border-gray-100 bg-white p-3 text-sm">
                    <p className="mb-2 font-mono text-xs font-semibold text-gray-600">{field}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md bg-red-50 px-2 py-1.5 text-red-900">
                        <span className="text-[10px] font-bold uppercase text-red-600">Before</span>
                        <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-xs">
                          {formatValue(change.before)}
                        </pre>
                      </div>
                      <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-emerald-900">
                        <span className="text-[10px] font-bold uppercase text-emerald-600">After</span>
                        <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-xs">
                          {formatValue(change.after)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Metadata（JSON）</h3>
            <pre className="max-h-64 overflow-auto rounded-xl border border-gray-200 bg-gray-950 p-4 text-xs text-emerald-200">
              {log.metadata
                ? JSON.stringify(log.metadata, null, 2)
                : "（無額外資料）"}
            </pre>
          </div>

          {log.userAgent ? (
            <div>
              <h3 className="mb-1 text-xs font-semibold text-gray-500">User-Agent</h3>
              <p className="break-all text-xs text-gray-600">{log.userAgent}</p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
