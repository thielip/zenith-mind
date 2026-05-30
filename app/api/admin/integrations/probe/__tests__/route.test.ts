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
  probeSearchConsole: jest.fn(),
}));

import { Errors } from "@/domain/shared/core.types";
import { gateAdminRead } from "@/lib/auth/resolve-admin-action";
import { probeSearchConsole } from "@/infrastructure/health/probes";
import { POST } from "../route";

const gateAdminReadMock = jest.mocked(gateAdminRead);
const probeSearchConsoleMock = jest.mocked(probeSearchConsole);

describe("POST /api/admin/integrations/probe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    probeSearchConsoleMock.mockResolvedValue({
      ok: true,
      message: "GSC 可存取 https://example.com/（siteOwner）",
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

  it("probes search-console-live via probeSearchConsole", async () => {
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
    const json = (await res.json()) as { ok: boolean; message?: string };
    expect(json.ok).toBe(true);
    expect(probeSearchConsoleMock).toHaveBeenCalled();
    expect(json.message).toContain("GSC 可存取");
  });
});
