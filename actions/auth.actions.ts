// actions/auth.actions.ts — Node Runtime
// Server Actions：登入、TOTP、Refresh、登出
// 執行順序：Zod → 清洗（純文字，Zod 已防型別攻擊）→ AuditLog → Business Logic

"use server";

import { z } from "zod";
import { cookies, headers } from "next/headers";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";
import {
  loginWithEmail,
  verifyTotpAndIssue,
  refreshTokens,
  logout,
} from "@/domain/auth/auth.service";
import { writeAuditLog } from "@/infrastructure/db/adapters/audit.prisma-adapter";
import {
  ACCESS_TOKEN_COOKIE_MAX_AGE_SEC,
  REFRESH_TOKEN_COOKIE_MAX_AGE_SEC,
} from "@/lib/auth/constants";

// ── Cookie 設定 ───────────────────────────────────────────

const IS_PROD = process.env["NODE_ENV"] === "production";

const COOKIE_BASE = {
  httpOnly: true,
  secure:   IS_PROD,
  sameSite: "strict" as const,
  path:     "/",
};

// ── Zod Schema ────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1)
    .max(200)
    .refine(
      (v) => {
        const e = v.trim().toLowerCase();
        return e === "guest" || z.string().email().safeParse(e).success;
      },
      { message: "請輸入有效 Email，或參訪帳號 guest" }
    ),
  password: z.string().min(4).max(128),
});

const totpSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
});

// ── 取得請求資訊（Audit Log 用）──────────────────────────

async function getRequestMeta() {
  const h = await headers();
  return {
    ip:        h.get("CF-Connecting-IP") ?? h.get("x-forwarded-for") ?? "unknown",
    userAgent: h.get("user-agent") ?? "",
    requestId: crypto.randomUUID(),
  };
}

// ═══════════════════════════════════════════════════════
// Action 1：登入
// ═══════════════════════════════════════════════════════

export async function loginAction(
  input: unknown
): Promise<ActionResult<{ requireTotp: boolean }>> {
  const meta = await getRequestMeta();

  try {
    // Step 3：Zod Validation
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const { password } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();

    // Step 6：Business Logic
    const result = await loginWithEmail(email, password);
    const jar    = await cookies();

    if (result.requireTotp && result.tempToken) {
      jar.set("temp_token", result.tempToken, { ...COOKIE_BASE, maxAge: 5 * 60 });

      void writeAuditLog({ action: "LOGIN", metadata: { step: "totp_required", email }, ...meta });
      return { success: true, data: { requireTotp: true }, error: null };
    }

    if (result.tokens) {
      jar.set("access_token",  result.tokens.accessToken,  { ...COOKIE_BASE, maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_SEC });
      jar.set("refresh_token", result.tokens.refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_SEC });

      void writeAuditLog({ action: "LOGIN", metadata: { step: "success_no_totp", email }, ...meta });
      return { success: true, data: { requireTotp: false }, error: null };
    }

    return { success: false, data: null, error: Errors.internal(meta.requestId) };

  } catch (e: unknown) {
    const isAuthFail = e instanceof Error && e.message === "AUTH_FAILED";
    void writeAuditLog({
      action: "LOGIN",
      metadata: { step: "failed", reason: isAuthFail ? "invalid_credentials" : "internal" },
      ...meta,
    });
    if (isAuthFail) return { success: false, data: null, error: Errors.auth() };
    console.error(`[Auth] login error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

// ═══════════════════════════════════════════════════════
// Action 2：TOTP 驗證
// ═══════════════════════════════════════════════════════

export async function verifyTotpAction(
  input: unknown
): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();

  try {
    const parsed = totpSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const jar       = await cookies();
    const tempToken = jar.get("temp_token")?.value;
    if (!tempToken) return { success: false, data: null, error: Errors.auth() };

    const tokens = await verifyTotpAndIssue(tempToken, parsed.data.code);

    jar.delete("temp_token");
    jar.set("access_token",  tokens.accessToken,  { ...COOKIE_BASE, maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_SEC });
    jar.set("refresh_token", tokens.refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_SEC });

    void writeAuditLog({ action: "TOTP_VERIFY", metadata: { step: "success" }, ...meta });
    return { success: true, data: undefined, error: null };

  } catch (e: unknown) {
    const isTotpInvalid = e instanceof Error && e.message === "TOTP_INVALID";
    void writeAuditLog({
      action: "TOTP_VERIFY",
      metadata: { step: "failed", reason: isTotpInvalid ? "invalid_code" : "internal" },
      ...meta,
    });
    if (isTotpInvalid) return { success: false, data: null, error: Errors.totpInvalid() };
    console.error(`[Auth] TOTP error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

// ═══════════════════════════════════════════════════════
// Action 3：Silent Refresh
// ═══════════════════════════════════════════════════════

export async function refreshAction(): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();

  try {
    const jar          = await cookies();
    const refreshToken = jar.get("refresh_token")?.value;
    if (!refreshToken) return { success: false, data: null, error: Errors.auth() };

    const tokens = await refreshTokens(refreshToken);

    jar.set("access_token",  tokens.accessToken,  { ...COOKIE_BASE, maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_SEC });
    jar.set("refresh_token", tokens.refreshToken, { ...COOKIE_BASE, maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_SEC });

    return { success: true, data: undefined, error: null };

  } catch (e: unknown) {
    const jar = await cookies();
    jar.delete("access_token");
    jar.delete("refresh_token");
    console.error(`[Auth] refresh error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.auth() };
  }
}

// ═══════════════════════════════════════════════════════
// Action 4：登出
// ═══════════════════════════════════════════════════════

export async function logoutAction(): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();

  try {
    const jar          = await cookies();
    const refreshToken = jar.get("refresh_token")?.value;

    if (refreshToken) await logout(refreshToken);

    jar.delete("access_token");
    jar.delete("refresh_token");
    jar.delete("temp_token");

    void writeAuditLog({ action: "LOGOUT", ...meta });
    return { success: true, data: undefined, error: null };

  } catch (e: unknown) {
    console.error(`[Auth] logout error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}
