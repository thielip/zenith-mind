import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/lib/auth/resolve-admin-action", () => ({
  gateAdminOnly: jest.fn(),
}));

import { Errors } from "@/domain/shared/core.types";
import { gateAdminOnly } from "@/lib/auth/resolve-admin-action";
import { POST } from "../route";

const gateAdminOnlyMock = jest.mocked(gateAdminOnly);

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
        error: Errors.auth(),
      },
    });

    const response = await POST(
      new Request("http://localhost/api/ai/jobs", {
        method: "POST",
        body: JSON.stringify(validBody),
      }) as never
    );

    expect(response.status).toBe(401);
  });

  it("rejects GUEST role", async () => {
    gateAdminOnlyMock.mockResolvedValue({
      ok: false,
      result: {
        success: false,
        data: null,
        error: Errors.forbidden(),
      },
    });

    const response = await POST(
      new Request("http://localhost/api/ai/jobs", {
        method: "POST",
        body: JSON.stringify(validBody),
      }) as never
    );

    expect(response.status).toBe(403);
  });

  it("validates request body", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/jobs", {
        method: "POST",
        body: JSON.stringify({}),
      }) as never
    );

    expect(response.status).toBe(400);
  });

  it("creates a pending job for the authenticated user", async () => {
    prismaMock.aiJob.create.mockResolvedValue({ id: "job-1" });

    const response = await POST(
      new Request("http://localhost/api/ai/jobs", {
        method: "POST",
        body: JSON.stringify(validBody),
      }) as never
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
      new Request("http://localhost/api/ai/jobs", {
        method: "POST",
        body: JSON.stringify(validBody),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      jobId: "existing-job",
      idempotent: true,
    });
  });
});
