// app/api/auth/refresh/route.ts — Node Runtime
// Silent Refresh API Route（fetch.client.ts 呼叫）
// ⚠ export const dynamic = 'force-dynamic'（Route Handler 專用）

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens } from "@/domain/auth/auth.service";
import {
  ACCESS_TOKEN_COOKIE_MAX_AGE_SEC,
  REFRESH_TOKEN_COOKIE_MAX_AGE_SEC,
} from "@/lib/auth/constants";

export const dynamic = "force-dynamic";

const IS_PROD = process.env["NODE_ENV"] === "production";
const COOKIE_BASE = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: "lax" as const,
  path:     "/",
};

export async function POST(_req: NextRequest): Promise<NextResponse> {
  try {
    const jar          = await cookies();
    const refreshToken = jar.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ success: false, error: "NO_REFRESH_TOKEN" }, { status: 401 });
    }

    const tokens = await refreshTokens(refreshToken);

    jar.set("access_token",  tokens.accessToken,  { ...COOKIE_BASE, maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_SEC });
    jar.set("refresh_token", tokens.refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_SEC });

    return NextResponse.json({ success: true });

  } catch (e: unknown) {
    const jar = await cookies();
    jar.delete("access_token");
    jar.delete("refresh_token");

    const isRevoked = e instanceof Error &&
      (e.message === "REFRESH_TOKEN_REVOKED" || e.message === "USER_NOT_FOUND");

    return NextResponse.json(
      { success: false, error: isRevoked ? "SESSION_EXPIRED" : "INTERNAL_ERROR" },
      { status: 401 }
    );
  }
}
