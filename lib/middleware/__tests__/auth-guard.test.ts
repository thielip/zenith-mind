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

  it("allows guest on read-only dashboard routes", async () => {
    const token = await signAccessToken({
      userId: "guest-1",
      email: "guest@gmail.com",
      role: "GUEST",
    });

    const response = await adminAuthGuard(
      request("/admin/dashboard/seo", token)
    );

    expect(response).toBeNull();
  });

  it("returns 403 for guest on admin-only pages", async () => {
    const token = await signAccessToken({
      userId: "guest-1",
      email: "guest@gmail.com",
      role: "GUEST",
    });

    const response = await adminAuthGuard(request("/admin/users", token));

    expect(response?.status).toBe(403);
  });

  it("returns 401 for admin api without token", async () => {
    const response = await adminAuthGuard(
      request("/api/admin/realtime/stream")
    );

    expect(response?.status).toBe(401);
    const body = await response?.json();
    expect(body).toEqual({ error: "UNAUTHORIZED" });
  });

  it("returns 403 for guest on ai api", async () => {
    const token = await signAccessToken({
      userId: "guest-1",
      email: "guest@gmail.com",
      role: "GUEST",
    });

    const response = await adminAuthGuard(request("/api/ai/jobs", token));

    expect(response?.status).toBe(403);
    const body = await response?.json();
    expect(body).toEqual({ error: "FORBIDDEN" });
  });

  it("returns 403 for guest on nested ai job polling path", async () => {
    const token = await signAccessToken({
      userId: "guest-1",
      email: "guest@gmail.com",
      role: "GUEST",
    });

    const response = await adminAuthGuard(
      request("/api/ai/jobs/clxyz123", token)
    );

    expect(response?.status).toBe(403);
  });

  it("allows guest on read admin api", async () => {
    const token = await signAccessToken({
      userId: "guest-1",
      email: "guest@gmail.com",
      role: "GUEST",
    });

    const response = await adminAuthGuard(
      request("/api/admin/realtime/stream", token)
    );

    expect(response).toBeNull();
  });

  it("rejects temporary TOTP tokens on protected admin routes", async () => {
    const token = await signTempToken("user-1");

    const response = await adminAuthGuard(request("/admin/dashboard", token));

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/admin/login");
  });
});
