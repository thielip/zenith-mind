import { createCookieJar } from "@/test-utils/next-mocks";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));
jest.mock("@/domain/auth/auth.service", () => ({
  refreshTokens: jest.fn(),
}));

import { cookies } from "next/headers";
import { refreshTokens } from "@/domain/auth/auth.service";
import { POST } from "../route";

const cookiesMock = jest.mocked(cookies);
const refreshTokensMock = jest.mocked(refreshTokens);

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when refresh cookie is missing", async () => {
    cookiesMock.mockResolvedValue(createCookieJar());

    const response = await POST(new Request("http://localhost/api/auth/refresh") as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ success: false, error: "NO_REFRESH_TOKEN" });
  });

  it("rotates cookies when refresh succeeds", async () => {
    const jar = createCookieJar({ refresh_token: "old-refresh" });
    cookiesMock.mockResolvedValue(jar);
    refreshTokensMock.mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });

    const response = await POST(new Request("http://localhost/api/auth/refresh") as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(jar.set).toHaveBeenCalledWith("access_token", "new-access", expect.objectContaining({ httpOnly: true }));
    expect(jar.set).toHaveBeenCalledWith("refresh_token", "new-refresh", expect.objectContaining({ httpOnly: true }));
  });

  it("clears auth cookies when refresh fails", async () => {
    const jar = createCookieJar({ refresh_token: "revoked" });
    cookiesMock.mockResolvedValue(jar);
    refreshTokensMock.mockRejectedValue(new Error("REFRESH_TOKEN_REVOKED"));

    const response = await POST(new Request("http://localhost/api/auth/refresh") as never);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("SESSION_EXPIRED");
    expect(jar.delete).toHaveBeenCalledWith("access_token");
    expect(jar.delete).toHaveBeenCalledWith("refresh_token");
  });
});
