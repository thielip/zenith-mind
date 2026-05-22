// lib/blog/post-access-cookie.ts — 文章密碼解鎖 Cookie（Web Crypto，Edge / Worker 相容）

import { cookies } from "next/headers";

const COOKIE_PREFIX = "post_unlock_";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 天

function secret(): string | null {
  return (
    process.env["POST_ACCESS_SECRET"]?.trim() ||
    process.env["JWT_ACCESS_SECRET"]?.trim() ||
    null
  );
}

function cookieName(slug: string): string {
  return `${COOKIE_PREFIX}${slug}`;
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signPostUnlockToken(
  slug: string,
  postId: string
): Promise<string> {
  const key = secret();
  if (!key) throw new Error("POST_ACCESS_SECRET_REQUIRED");
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `${slug}:${postId}:${exp}`;
  const sig = await hmacSha256Hex(key, payload);
  return `${exp}.${sig}`;
}

async function verifyToken(
  slug: string,
  postId: string,
  token: string
): Promise<boolean> {
  const key = secret();
  if (!key) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const payload = `${slug}:${postId}:${exp}`;
  const expected = await hmacSha256Hex(key, payload);
  return sig === expected;
}

export async function hasPostAccess(slug: string, postId: string): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(cookieName(slug))?.value;
  if (!token) return false;
  return verifyToken(slug, postId, token);
}

export function postUnlockCookieOptions(slug: string, token: string) {
  const isProd = process.env["NODE_ENV"] === "production";
  return {
    name: cookieName(slug),
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: `/`,
    maxAge: MAX_AGE_SEC,
  };
}
