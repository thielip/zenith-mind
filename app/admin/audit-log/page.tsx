// app/admin/audit-log/page.tsx — 操作紀錄查閱
// Cache 模式 B：force-dynamic（即時數據）

import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";

export const metadata: Metadata = { title: "操作紀錄 | Admin" };
export const dynamic = "force-dynamic";

interface SearchParams {
  page?:   string;
  action?: string;
}

const PER_PAGE = 50;

const ACTION_ZH: Record<string, string> = {
  CREATE:      "建立",
  UPDATE:      "更新",
  DELETE:      "刪除",
  LOGIN:       "登入",
  LOGOUT:      "登出",
  TOTP_SETUP:  "設定 2FA",
  TOTP_VERIFY: "驗證 2FA",
  AI_GENERATE: "AI 生成",
  PUBLISH:     "發布",
  SCHEDULE:    "排程",
};

const ACTION_COLOR: Record<string, string> = {
  CREATE:      "bg-green-100 text-green-700",
  UPDATE:      "bg-blue-100 text-blue-700",
  DELETE:      "bg-red-100 text-red-600",
  LOGIN:       "bg-purple-100 text-purple-700",
  LOGOUT:      "bg-gray-100 text-gray-600",
  TOTP_SETUP:  "bg-yellow-100 text-yellow-700",
  TOTP_VERIFY: "bg-yellow-100 text-yellow-700",
  AI_GENERATE: "bg-indigo-100 text-indigo-700",
  PUBLISH:     "bg-teal-100 text-teal-700",
  SCHEDULE:    "bg-orange-100 text-orange-700",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp     = await searchParams;
  const page   = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip   = (page - 1) * PER_PAGE;

  const where: Prisma.AuditLogWhereInput = sp.action
    ? { action: sp.action as AuditAction }
    : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take:    PER_PAGE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">操作紀錄</h1>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-100 text-sm"
            aria-label="操作紀錄列表"
          >
            <thead className="bg-gray-50">
              <tr>
                {["時間", "操作者", "動作", "對象", "IP", "Request ID"].map(
                  (h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    <time dateTime={log.createdAt.toISOString()}>
                      {log.createdAt.toLocaleString("zh-TW")}
                    </time>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {log.user?.email ?? "系統"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLOR[log.action] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {ACTION_ZH[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {log.entityType
                      ? `${log.entityType}${log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : ""}`
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                    {log.ipMasked ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                    {log.requestId?.slice(0, 8) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            尚無操作紀錄
          </div>
        )}

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="flex justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              共 {total.toLocaleString()} 筆
            </p>
            <nav
              aria-label="分頁導覽"
              className="flex gap-1"
            >
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(
                (p) => (
                  <a
                    key={p}
                    href={`?page=${p}${sp.action ? `&action=${sp.action}` : ""}`}
                    aria-current={p === page ? "page" : undefined}
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded text-xs",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      p === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-500 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    {p}
                  </a>
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
