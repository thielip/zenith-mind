import { createCookieJar } from "@/test-utils/next-mocks";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));
jest.mock("@/lib/auth/jwt", () => ({
  verifyAccessToken: jest.fn(),
}));
jest.mock("@/domain/ai/ai.job-manager", () => ({
  aiJobManager: {
    getJobStatusForUser: jest.fn(),
  },
}));

import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { aiJobManager } from "@/domain/ai/ai.job-manager";
import { GET } from "../route";

const cookiesMock = jest.mocked(cookies);
const verifyAccessTokenMock = jest.mocked(verifyAccessToken);
const getJobStatusForUserMock = jest.mocked(aiJobManager.getJobStatusForUser);

describe("GET /api/ai/jobs/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cookiesMock.mockResolvedValue(createCookieJar({ access_token: "access" }));
    verifyAccessTokenMock.mockResolvedValue({
      userId: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
      tokenType: "access",
    });
  });

  it("rejects missing auth cookie", async () => {
    cookiesMock.mockResolvedValue(createCookieJar());

    const response = await GET(new Request("http://localhost/api/ai/jobs/job-1") as never, {
      params: Promise.resolve({ id: "job-1" }),
    });

    expect(response.status).toBe(401);
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
