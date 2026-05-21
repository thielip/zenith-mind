jest.mock("@/lib/auth/resolve-admin-action", () => ({
  gateAdminRead: jest.fn(),
}));
jest.mock("@/lib/admin/load-audit-logs", () => ({
  loadAuditLogsForExport: jest.fn(),
}));

import { NextRequest } from "next/server";
import { gateAdminRead } from "@/lib/auth/resolve-admin-action";
import { loadAuditLogsForExport } from "@/lib/admin/load-audit-logs";
import { GET } from "../route";

function exportRequest() {
  return new NextRequest("http://localhost/api/admin/audit-log/export");
}

const gateAdminReadMock = jest.mocked(gateAdminRead);
const loadAuditLogsForExportMock = jest.mocked(loadAuditLogsForExport);

describe("GET /api/admin/audit-log/export", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadAuditLogsForExportMock.mockResolvedValue([
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        userEmail: "admin@example.com",
        action: "LOGIN",
        entityType: "user",
        entityId: "u1",
        ip: "127.0.0.1",
        requestId: "req-1",
        metadata: "{}",
      },
    ]);
  });

  it("returns 401 when not authenticated", async () => {
    gateAdminReadMock.mockResolvedValue({
      ok: false,
      result: { success: false, data: null, error: { code: "AUTH" } },
    });

    const res = await GET(exportRequest());
    expect(res.status).toBe(401);
  });

  it("returns CSV for authenticated admin", async () => {
    gateAdminReadMock.mockResolvedValue({
      ok: true,
      session: { userId: "u1", email: "admin@example.com", role: "ADMIN" },
    });

    const res = await GET(exportRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const body = await res.text();
    expect(body).toContain("時間");
    expect(body).toContain("LOGIN");
    expect(body).toContain("admin@example.com");
  });
});
