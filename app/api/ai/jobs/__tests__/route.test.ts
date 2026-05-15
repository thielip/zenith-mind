import { createCookieJar } from "@/test-utils/next-mocks";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));
jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/lib/auth/jwt", () => ({
  verifyAccessToken: jest.fn(),
}));

import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { POST } from "../route";

const cookiesMock = jest.mocked(cookies);
const verifyAccessTokenMock = jest.mocked(verifyAccessToken);

const validBody = {
  version: 1,
  type: "GENERATE_DRAFT",
  postId: "clpost0000000000000000000",
  idempotencyKey: "idem-123456789012",
  options: {
    topic: "AI SEO",
    locale: "zh-TW",
    targetLength: "short",
  },
};

describe("POST /api/ai/jobs", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
    cookiesMock.mockResolvedValue(createCookieJar({ access_token: "access" }));
    verifyAccessTokenMock.mockResolvedValue({
      userId: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
      tokenType: "access",
    });
  });

  it("rejects missing access token", async () => {
    cookiesMock.mockResolvedValue(createCookieJar());

    const response = await POST(
      new Request("http://localhost/api/ai/jobs", { method: "POST", body: JSON.stringify(validBody) }) as never
    );

    expect(response.status).toBe(401);
  });

  it("validates request body", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/jobs", { method: "POST", body: JSON.stringify({}) }) as never
    );

    expect(response.status).toBe(400);
  });

  it("creates a pending job for the authenticated user", async () => {
    prismaMock.aiJob.create.mockResolvedValue({ id: "job-1" });

    const response = await POST(
      new Request("http://localhost/api/ai/jobs", { method: "POST", body: JSON.stringify(validBody) }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ success: true, jobId: "job-1" });
    expect(prismaMock.aiJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", status: "PENDING" }),
      })
    );
  });

  it("returns existing job on idempotency conflict", async () => {
    prismaMock.aiJob.create.mockRejectedValue({ code: "P2002" });
    prismaMock.aiJob.findUnique.mockResolvedValue({ id: "existing-job" });

    const response = await POST(
      new Request("http://localhost/api/ai/jobs", { method: "POST", body: JSON.stringify(validBody) }) as never
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, jobId: "existing-job", idempotent: true });
  });
});
