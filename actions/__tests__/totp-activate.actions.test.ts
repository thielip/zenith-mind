import { createCookieJar, createHeaders } from "@/test-utils/next-mocks";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));
jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/lib/auth/jwt", () => ({
  verifyAccessToken: jest.fn(),
}));
jest.mock("@/lib/auth/totp", () => ({
  verifyTotpToken: jest.fn(),
}));
jest.mock("@/infrastructure/db/adapters/audit.prisma-adapter", () => ({
  writeAuditLog: jest.fn(),
}));

import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { verifyTotpToken } from "@/lib/auth/totp";
import { activateTotpAction } from "../totp-activate.actions";

const cookiesMock = jest.mocked(cookies);
const headersMock = jest.mocked(headers);
const verifyAccessTokenMock = jest.mocked(verifyAccessToken);
const verifyTotpTokenMock = jest.mocked(verifyTotpToken);

describe("activateTotpAction", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
    cookiesMock.mockResolvedValue(createCookieJar({ access_token: "access" }));
    headersMock.mockResolvedValue(createHeaders());
    verifyAccessTokenMock.mockResolvedValue({
      userId: "cluser00000000000000000",
      email: "admin@example.com",
      role: "ADMIN",
      tokenType: "access",
    });
    verifyTotpTokenMock.mockReturnValue(true);
    prismaMock.user.findUnique.mockResolvedValue({ id: "cluser00000000000000000", totpEnabled: false });
    prismaMock.user.update.mockResolvedValue({});
  });

  it("rejects invalid input", async () => {
    const result = await activateTotpAction({ userId: "bad", encryptedSecret: "x", code: "abc" });

    expect(result.success).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects attempts to activate another user's TOTP", async () => {
    const result = await activateTotpAction({
      userId: "clother00000000000000000",
      encryptedSecret: "encrypted-secret-encrypted-secret",
      code: "123456",
    });

    expect(result.success).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("activates TOTP for the authenticated user only", async () => {
    const result = await activateTotpAction({
      userId: "cluser00000000000000000",
      encryptedSecret: "encrypted-secret-encrypted-secret",
      code: "123456",
    });

    expect(result.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "cluser00000000000000000" },
      data: expect.objectContaining({ totpEnabled: true }),
    });
  });

  it("rejects invalid TOTP codes", async () => {
    verifyTotpTokenMock.mockReturnValue(false);

    const result = await activateTotpAction({
      userId: "cluser00000000000000000",
      encryptedSecret: "encrypted-secret-encrypted-secret",
      code: "000000",
    });

    expect(result.success).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
