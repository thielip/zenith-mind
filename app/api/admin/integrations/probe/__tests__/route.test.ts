jest.mock("@/lib/auth/resolve-admin-action", () => ({
  gateAdminRead: jest.fn(),
}));
jest.mock("@/infrastructure/health/probes", () => ({
  probeDatabase: jest.fn(),
  probeGa4Reporting: jest.fn(),
  probeGemini: jest.fn(),
  probeGoogleAdsOAuth: jest.fn(),
  probeRedis: jest.fn(),
  probeSupabaseStorage: jest.fn(),
  withProbeTimeout: jest.fn((p: Promise<unknown>) => p),
}));
jest.mock("@/services/google/search-console", () => ({
  fetchSearchConsoleSummary: jest.fn(),
}));

import { Errors } from "@/domain/shared/core.types";
import { gateAdminRead } from "@/lib/auth/resolve-admin-action";
import { probeDatabase } from "@/infrastructure/health/probes";
import { fetchSearchConsoleSummary } from "@/services/google/search-console";
import { POST } from "../route";

const gateAdminReadMock = jest.mocked(gateAdminRead);
const probeDatabaseMock = jest.mocked(probeDatabase);
const fetchGscMock = jest.mocked(fetchSearchConsoleSummary);

describe("POST /api/admin/integrations/probe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    probeDatabaseMock.mockResolvedValue({ ok: true, message: "ok" });
    fetchGscMock.mockResolvedValue({
      ok: true,
      queries: [],
      landingPages: [],
      totals: { clicks: 10, impressions: 100, ctr: 0.1 },
    });
  });

  it("returns 401 without admin session", async () => {
    gateAdminReadMock.mockResolvedValue({
      ok: false,
      result: { success: false, data: null, error: Errors.auth() },
    });

    const res = await POST(
      new Request("http://localhost/api/admin/integrations/probe", {
        method: "POST",
        body: JSON.stringify({ id: "postgres" }),
      }) as never
    );
    expect(res.status).toBe(401);
  });

  it("probes postgres and search-console-live", async () => {
    gateAdminReadMock.mockResolvedValue({
      ok: true,
      session: { userId: "u1", email: "a@b.com", role: "ADMIN" },
    });

    const res = await POST(
      new Request("http://localhost/api/admin/integrations/probe", {
        method: "POST",
        body: JSON.stringify({ id: "search-console-live" }),
      }) as never
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
    expect(fetchGscMock).toHaveBeenCalled();
  });
});
