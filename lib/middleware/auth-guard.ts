// lib/middleware/auth-guard.ts — Edge Runtime
// JWT 路由守衛（jose，Edge Web Crypto API）
// ⚠ 禁止使用 jsonwebtoken（Node.js crypto，Edge 不相容）

import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED = [
  "/admin/dashboard",
  "/admin/site",
  "/admin/posts",
  "/admin/media",
  "/admin/affiliate",
  "/admin/analytics",
  "/admin/audit-log",
  "/admin/settings",
];

const PUBLIC_ADMIN = ["/admin/login", "/admin/totp"];

async function verifyJwt(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(
      process.env["JWT_ACCESS_SECRET"] ?? ""
    );
    if (!process.env["JWT_ACCESS_SECRET"]) return false;
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const role = payload["role"];
    return (
      payload["tokenType"] === "access" &&
      (role === "ADMIN" || role === "GUEST") &&
      typeof payload["userId"] === "string" &&
      typeof payload["email"] === "string" &&
      !("purpose" in payload)
    );
  } catch {
    return false;
  }
}

export async function adminAuthGuard(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isPublic    = PUBLIC_ADMIN.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token =
      request.cookies.get("access_token")?.value ??
      request.headers.get("Authorization")?.replace("Bearer ", "") ??
      "";

    const valid = token ? await verifyJwt(token) : false;

    if (!valid) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(url);
      res.cookies.delete("access_token");
      return res;
    }
  }

  // 已登入者訪問 /admin/login → 轉向 dashboard
  if (isPublic && pathname === "/admin/login") {
    const token = request.cookies.get("access_token")?.value ?? "";
    if (token && (await verifyJwt(token))) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return null; // 繼續下一步
}
