// app/admin/audit-log/page.tsx — 操作紀錄查閱
// Cache 模式 B：force-dynamic（即時數據）

import type { Metadata } from "next";
import AuditLogManager from "@/components/admin/audit-log/AuditLogManager";
import { loadAuditLogOperators, loadAuditLogs } from "@/lib/admin/load-audit-logs";
import { parseAuditLogListParams } from "@/lib/admin/audit-log-params";

export const metadata: Metadata = { title: "操作紀錄 | Admin" };
export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = parseAuditLogListParams(sp);

  const [{ logs, total, totalPages }, operators] = await Promise.all([
    loadAuditLogs(params),
    loadAuditLogOperators(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">操作紀錄</h1>
      <AuditLogManager
        logs={logs}
        total={total}
        page={params.page}
        perPage={params.perPage}
        totalPages={totalPages}
        operators={operators}
        params={params}
      />
    </div>
  );
}
