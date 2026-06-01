// lib/middleware/auth-guard.ts — Edge Runtime
// JWT 路由守衛（jose，Edge Web Crypto API）
// RBAC：GUEST 可讀後台；ADMIN_ONLY 路徑拒絕 GUEST（403）

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  canAccessAdminRoute,
  isAdminAuthenticatedApi,
  isAdminProtectedPage,
  isAdminPublicPage,
} from "@/lib/auth/admin-route-policy";
import { verifyAccessToken } from "@/lib/auth/jwt";

function extractAccessToken(request: NextRequest): string {
  return (
    request.cookies.get("access_token")?.value ??
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ??
    ""
  );
}

function forbiddenResponse(): NextResponse {
  return new NextResponse("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function unauthorizedJson(): NextResponse {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}

function forbiddenJson(): NextResponse {
  return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
}

async function resolveAccess(
  token: string
): Promise<{ ok: true; role: "ADMIN" | "GUEST" } | { ok: false }> {
  if (!token || !process.env["JWT_ACCESS_SECRET"]) return { ok: false };
  try {
    const payload = await verifyAccessToken(token);
    return { ok: true, role: payload.role };
  } catch {
    return { ok: false };
  }
}

export async function adminAuthGuard(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const token = extractAccessToken(request);

  if (isAdminAuthenticatedApi(pathname)) {
    const access = await resolveAccess(token);
    if (!access.ok) return unauthorizedJson();
    if (!canAccessAdminRoute(pathname, access.role)) return forbiddenJson();
    return null;
  }

  if (isAdminProtectedPage(pathname)) {
    const access = await resolveAccess(token);
    if (!access.ok) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(url);
      res.cookies.delete("access_token");
      return res;
    }
    if (!canAccessAdminRoute(pathname, access.role)) {
      return forbiddenResponse();
    }
    return null;
  }

  if (isAdminPublicPage(pathname) && pathname === "/admin/login") {
    const access = await resolveAccess(token);
    if (access.ok) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return null;
}
