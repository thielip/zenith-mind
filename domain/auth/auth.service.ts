// domain/auth/auth.service.ts — Node Runtime Only
// Level 3：Email+Password → Temp Token → TOTP → Access/Refresh Token Pair
// Silent Refresh → Redis 黑名單查詢（每次 refresh 1 次）
// Logout → Refresh Token 寫入黑名單（1 次寫入）

import { prisma } from "@/infrastructure/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  signAccessToken,
  signRefreshToken,
  signTempToken,
  verifyRefreshToken,
  verifyTempToken,
} from "@/lib/auth/jwt";
import { verifyTotpToken } from "@/lib/auth/totp";
import {
  blacklistRefreshToken,
  isRefreshTokenBlacklisted,
} from "@/infrastructure/redis/token-blacklist";
import { randomUUID } from "crypto";
import { seedBootstrapAdminIfEmpty } from "@/domain/auth/bootstrap";

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

export interface LoginResult {
  requireTotp: boolean;
  tempToken?:  string;   // TOTP 流程用
  tokens?:     TokenPair; // 無 TOTP 時直接發
}

// ── Step 1：Email + Password ───────────────────────────────

export async function loginWithEmail(
  email: string,
  password: string
): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase();

  await seedBootstrapAdminIfEmpty();

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  });

  // timing-safe：無論帳號是否存在，都執行 bcrypt 比對（防枚舉）
  if (!user) {
    await verifyPassword("dummy", "$2b$12$dummyhashforpreventingtimingattacks00");
    throw new Error("AUTH_FAILED");
  }

  const verified = await verifyPassword(password, user.password);
  if (!verified) {
    throw new Error("AUTH_FAILED");
  }

  if (user.totpEnabled && user.totpSecret) {
    return { requireTotp: true, tempToken: await signTempToken(user.id) };
  }

  return { requireTotp: false, tokens: await issueTokenPair(user.id, user.email) };
}

// ── Step 2：TOTP 驗證 → 換發正式 Token ───────────────────

export async function verifyTotpAndIssue(
  tempToken: string,
  code: string
): Promise<TokenPair> {
  const payload = await verifyTempToken(tempToken);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId, deletedAt: null },
  });

  if (!user?.totpSecret || !user.totpEnabled) {
    throw new Error("TOTP_NOT_CONFIGURED");
  }

  if (!verifyTotpToken(user.totpSecret, code)) {
    throw new Error("TOTP_INVALID");
  }

  await prisma.user.update({
    where: { id: user.id },
    data:  { totpVerifiedAt: new Date() },
  });

  return issueTokenPair(user.id, user.email);
}

// ── Silent Refresh ────────────────────────────────────────

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const payload = await verifyRefreshToken(refreshToken);

  // 每次 refresh 查一次 Redis 黑名單（非每次請求）
  if (await isRefreshTokenBlacklisted(payload.tokenId)) {
    throw new Error("REFRESH_TOKEN_REVOKED");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId, deletedAt: null },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  // Refresh Token Rotation：舊的進黑名單，換發新的
  await blacklistRefreshToken(payload.tokenId);
  return issueTokenPair(user.id, user.email);
}

// ── Logout ────────────────────────────────────────────────

export async function logout(refreshToken: string): Promise<void> {
  try {
    const payload = await verifyRefreshToken(refreshToken);
    await blacklistRefreshToken(payload.tokenId);
  } catch {
    // Token 已過期或無效，視為已登出，不拋錯
  }
}

// ── 內部工具 ──────────────────────────────────────────────

async function issueTokenPair(userId: string, email: string): Promise<TokenPair> {
  const tokenId = randomUUID();
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ userId, email, role: "ADMIN" }),
    signRefreshToken({ userId, tokenId }),
  ]);
  return { accessToken, refreshToken };
}
