jest.mock("@/lib/auth/resolve-admin-action", () => ({
  gateAdminOnly: jest.fn(),
}));
jest.mock("@/domain/ai/ai.job-manager", () => ({
  aiJobManager: {
    getJobStatusForUser: jest.fn(),
  },
}));

import { gateAdminOnly } from "@/lib/auth/resolve-admin-action";
import { aiJobManager } from "@/domain/ai/ai.job-manager";
import { GET } from "../route";

const gateAdminOnlyMock = jest.mocked(gateAdminOnly);
const getJobStatusForUserMock = jest.mocked(aiJobManager.getJobStatusForUser);

describe("GET /api/ai/jobs/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    gateAdminOnlyMock.mockResolvedValue({
      ok: true,
      session: {
        userId: "user-1",
        email: "admin@example.com",
        role: "ADMIN",
      },
    });
  });

  it("rejects unauthenticated requests", async () => {
    gateAdminOnlyMock.mockResolvedValue({
      ok: false,
      result: {
        success: false,
        data: null,
        error: {
          code: "AUTH_FAILED",
          message: "auth",
          retryable: false,
          severity: "warn",
        },
      },
    });

    const response = await GET(new Request("http://localhost/api/ai/jobs/job-1") as never, {
      params: Promise.resolve({ id: "job-1" }),
    });

    expect(response.status).toBe(401);
  });

  it("rejects guest role", async () => {
    gateAdminOnlyMock.mockResolvedValue({
      ok: false,
      result: {
        success: false,
        data: null,
        error: {
          code: "FORBIDDEN",
          message: "forbidden",
          retryable: false,
          severity: "warn",
        },
      },
    });

    const response = await GET(new Request("http://localhost/api/ai/jobs/job-1") as never, {
      params: Promise.resolve({ id: "job-1" }),
    });

    expect(response.status).toBe(403);
  });

  it("loads job status scoped to authenticated user", async () => {
    getJobStatusForUserMock.mockResolvedValue({
      id: "job-1",
      status: "PENDING",
      stepIndex: 0,
      retryCount: 0,
      result: null,
      failedReason: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    } as never);

    const response = await GET(new Request("http://localhost/api/ai/jobs/job-1") as never, {
      params: Promise.resolve({ id: "job-1" }),
    });

    expect(response.status).toBe(200);
    expect(getJobStatusForUserMock).toHaveBeenCalledWith("job-1", "user-1");
  });

  it("returns 404 when job does not belong to user", async () => {
    getJobStatusForUserMock.mockRejectedValue(new Error("not found"));

    const response = await GET(new Request("http://localhost/api/ai/jobs/job-2") as never, {
      params: Promise.resolve({ id: "job-2" }),
    });

    expect(response.status).toBe(404);
  });
});
