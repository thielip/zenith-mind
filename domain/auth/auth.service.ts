// domain/auth/auth.service.ts — Node Runtime Only
// Level 3：Email+Password → Temp Token → TOTP → Access/Refresh Token Pair
// Silent Refresh → Redis 黑名單查詢（每次 refresh 1 次）
// Logout → Refresh Token 寫入黑名單（1 次寫入）

import { prisma } from "@/infrastructure/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
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

  let user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  });

  // timing-safe：無論帳號是否存在，都執行 bcrypt 比對（防枚舉）
  if (!user) {
    user = await bootstrapDevelopmentAdmin(normalizedEmail, password);
  }

  if (!user) {
    if (process.env["NODE_ENV"] === "development") {
      console.error("[Auth] user not found:", normalizedEmail);
    }
    await verifyPassword("dummy", "$2b$12$dummyhashforpreventingtimingattacks00");
    throw new Error("AUTH_FAILED");
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    const bootstrappedUser = await bootstrapDevelopmentAdmin(normalizedEmail, password);
    if (bootstrappedUser) user = bootstrappedUser;
  }

  const verified = await verifyPassword(password, user.password);
  if (!verified) {
    if (process.env["NODE_ENV"] === "development") {
      console.error("[Auth] password mismatch:", {
        email: normalizedEmail,
        passwordLength: password.length,
        hashPrefix: user.password.slice(0, 7),
      });
    }
    throw new Error("AUTH_FAILED");
  }

  if (user.totpEnabled && user.totpSecret) {
    return { requireTotp: true, tempToken: await signTempToken(user.id) };
  }

  return { requireTotp: false, tokens: await issueTokenPair(user.id, user.email) };
}

async function bootstrapDevelopmentAdmin(email: string, password: string) {
  if (process.env["NODE_ENV"] !== "development") return null;
  if (email !== process.env["ADMIN_BOOTSTRAP_EMAIL"]?.trim().toLowerCase()) return null;
  if (password !== process.env["ADMIN_BOOTSTRAP_PASSWORD"]) return null;

  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      password: passwordHash,
      role: "ADMIN",
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
    },
    update: {
      password: passwordHash,
      role: "ADMIN",
      deletedAt: null,
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
    },
  });
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
