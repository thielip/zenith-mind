import { createCookieJar } from "@/test-utils/next-mocks";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("@/lib/public-content/runtime", () => ({
  withPublicReadBackend: jest.fn(
    async (_supabase: () => Promise<unknown>, prisma: () => Promise<unknown>) => prisma()
  ),
}));
jest.mock("@/lib/blog/post-access-supabase", () => ({
  fetchProtectedPostHashBySlug: jest.fn(),
}));
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));
jest.mock("@/lib/request/request-meta", () => ({
  getRequestMeta: jest.fn(async () => ({
    ip: "203.0.113.1",
    userAgent: "jest-test",
    requestId: "test-request-id",
  })),
}));
jest.mock("@/lib/security/post-password-guard", () => ({
  assertPostPasswordAttemptAllowed: jest.fn(async () => ({ allowed: true })),
  delayAfterPostPasswordFailure: jest.fn(async () => undefined),
}));
jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/lib/auth/password", () => ({
  verifyPassword: jest.fn(),
}));
jest.mock("@/lib/blog/post-access-cookie", () => ({
  signPostUnlockToken: jest.fn(async () => "unlock-token"),
  postUnlockCookieOptions: jest.fn(() => ({
    name: "post_unlock_test",
    value: "unlock-token",
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 3600,
  })),
}));

import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth/password";
import { verifyPostPasswordAction } from "../post-access.actions";

const cookiesMock = jest.mocked(cookies);
const verifyPasswordMock = jest.mocked(verifyPassword);

describe("verifyPostPasswordAction", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
    cookiesMock.mockResolvedValue(createCookieJar());
    verifyPasswordMock.mockResolvedValue(true);
    prismaMock.post.findFirst.mockResolvedValue({
      id: "post-1",
      accessPasswordHash: "hash",
    });
  });

  it("rejects invalid input", async () => {
    const result = await verifyPostPasswordAction({ slug: "", password: "" });
    expect(result.success).toBe(false);
  });

  it("unlocks with correct password and sets cookie", async () => {
    const result = await verifyPostPasswordAction({
      slug: "secret-post",
      password: "correct",
    });

    expect(result.success).toBe(true);
    expect(result.data?.unlocked).toBe(true);
    expect(verifyPasswordMock).toHaveBeenCalledWith("correct", "hash");
    expect(cookiesMock).toHaveBeenCalled();
  });

  it("fails when post not found", async () => {
    prismaMock.post.findFirst.mockResolvedValue(null);

    const result = await verifyPostPasswordAction({
      slug: "missing",
      password: "x",
    });

    expect(result.success).toBe(false);
  });
});
