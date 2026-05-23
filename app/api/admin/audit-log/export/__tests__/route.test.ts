jest.mock("@/lib/auth/resolve-admin-action", () => ({
  gateAdminOnly: jest.fn(),
}));
jest.mock("@/lib/admin/load-audit-logs", () => ({
  loadAuditLogsForExport: jest.fn(),
}));

import { NextRequest } from "next/server";
import { Errors } from "@/domain/shared/core.types";
import { gateAdminOnly } from "@/lib/auth/resolve-admin-action";
import { loadAuditLogsForExport } from "@/lib/admin/load-audit-logs";
import { GET } from "../route";

function exportRequest() {
  return new NextRequest("http://localhost/api/admin/audit-log/export");
}

const gateAdminOnlyMock = jest.mocked(gateAdminOnly);
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
    gateAdminOnlyMock.mockResolvedValue({
      ok: false,
      result: {
        success: false,
        data: null,
        error: Errors.auth(),
      },
    });

    const res = await GET(exportRequest());
    expect(res.status).toBe(401);
  });

  it("returns 403 for GUEST", async () => {
    gateAdminOnlyMock.mockResolvedValue({
      ok: false,
      result: {
        success: false,
        data: null,
        error: Errors.forbidden(),
      },
    });

    const res = await GET(exportRequest());
    expect(res.status).toBe(403);
  });

  it("returns CSV for authenticated admin", async () => {
    gateAdminOnlyMock.mockResolvedValue({
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
