jest.mock("@/env", () => ({
  env: require("@/test-utils/env-mock").env,
}));

import { NextRequest } from "next/server";
import { signAccessToken, signTempToken } from "@/lib/auth/jwt";
import { adminAuthGuard } from "../auth-guard";

function request(path: string, token?: string) {
  const headers = new Headers();
  if (token) headers.set("cookie", `access_token=${token}`);
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe("adminAuthGuard", () => {
  it("redirects protected admin routes without a token", async () => {
    const response = await adminAuthGuard(request("/admin/dashboard"));

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/admin/login");
  });

  it("allows valid admin access tokens", async () => {
    const token = await signAccessToken({
      userId: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
    });

    const response = await adminAuthGuard(request("/admin/dashboard", token));

    expect(response).toBeNull();
  });

  it("rejects temporary TOTP tokens on protected admin routes", async () => {
    const token = await signTempToken("user-1");

    const response = await adminAuthGuard(request("/admin/dashboard", token));

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/admin/login");
  });
});
