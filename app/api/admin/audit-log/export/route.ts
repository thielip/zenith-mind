import { NextRequest, NextResponse } from "next/server";
import { gateAdminRead } from "@/lib/auth/resolve-admin-action";
import { parseAuditLogListParams } from "@/lib/admin/audit-log-params";
import { loadAuditLogsForExport } from "@/lib/admin/load-audit-logs";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  const gate = await gateAdminRead();
  if (!gate.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const params = parseAuditLogListParams(sp);
  const rows = await loadAuditLogsForExport(params);

  const header = [
    "時間",
    "操作者",
    "動作",
    "對象類型",
    "對象 ID",
    "IP",
    "Request ID",
    "Metadata",
  ];

  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.createdAt,
        r.userEmail,
        r.action,
        r.entityType,
        r.entityId,
        r.ip,
        r.requestId,
        r.metadata,
      ]
        .map((c) => csvEscape(String(c)))
        .join(",")
    ),
  ];

  const bom = "\uFEFF";
  const body = bom + lines.join("\n");
  const filename = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
