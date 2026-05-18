// lib/auth/jwt.ts — Edge + Node 雙相容（jose）
// ⚠ 禁止使用 jsonwebtoken（Node.js crypto，Edge crash）

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { ACCESS_TOKEN_JWT_EXPIRES } from "@/lib/auth/constants";

const REFRESH_EXPIRES = "7d";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export type AccessTokenRole = "ADMIN" | "GUEST";

export interface AccessTokenPayload extends JWTPayload {
  userId: string;
  email:  string;
  role:   AccessTokenRole;
  tokenType: "access";
}

export interface RefreshTokenPayload extends JWTPayload {
  userId:  string;
  tokenId: string; // Redis 黑名單識別碼
}

export interface TempTokenPayload extends JWTPayload {
  userId:  string;
  purpose: "totp_pending";
  tokenType: "temp";
}

// ── Access Token ──────────────────────────────────────────

export async function signAccessToken(
  p: Omit<AccessTokenPayload, "iat" | "exp" | "tokenType">
): Promise<string> {
  const secret = new TextEncoder().encode(requiredEnv("JWT_ACCESS_SECRET"));
  return new SignJWT({ ...p, tokenType: "access" } satisfies Omit<AccessTokenPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_JWT_EXPIRES)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const secret = new TextEncoder().encode(requiredEnv("JWT_ACCESS_SECRET"));
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  if (!isAccessPayload(payload)) {
    throw new Error("INVALID_ACCESS_TOKEN");
  }
  return payload;
}

export function isAccessPayload(payload: JWTPayload): payload is AccessTokenPayload {
  const role = payload["role"];
  return (
    payload["tokenType"] === "access" &&
    (role === "ADMIN" || role === "GUEST") &&
    typeof payload["userId"] === "string" &&
    typeof payload["email"] === "string" &&
    !("purpose" in payload)
  );
}

// ── Refresh Token ─────────────────────────────────────────

export async function signRefreshToken(
  p: Omit<RefreshTokenPayload, "iat" | "exp">
): Promise<string> {
  const secret = new TextEncoder().encode(requiredEnv("JWT_REFRESH_SECRET"));
  return new SignJWT(p)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRES)
    .sign(secret);
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const secret = new TextEncoder().encode(requiredEnv("JWT_REFRESH_SECRET"));
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  return payload as RefreshTokenPayload;
}

// ── Temp Token（TOTP 第二步，5 分鐘）────────────────────

export async function signTempToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(requiredEnv("JWT_ACCESS_SECRET"));
  return new SignJWT({ userId, purpose: "totp_pending", tokenType: "temp" } satisfies Omit<TempTokenPayload, "iat" | "exp">)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);
}

export async function verifyTempToken(token: string): Promise<TempTokenPayload> {
  const secret = new TextEncoder().encode(requiredEnv("JWT_ACCESS_SECRET"));
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  if ((payload as TempTokenPayload).purpose !== "totp_pending" || payload["tokenType"] !== "temp") {
    throw new Error("Invalid temp token purpose");
  }
  return payload as TempTokenPayload;
}

/** Token 剩餘秒數（Client silent refresh 判斷用） */
export function getRemainingSeconds(payload: JWTPayload): number {
  if (!payload.exp) return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}
