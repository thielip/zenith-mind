// lib/blog/post-access-cookie.ts — 文章密碼解鎖 Cookie（HMAC）

import { createHmac, timingSafeEqual } from "crypto";
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

export function signPostUnlockToken(slug: string, postId: string): string {
  const key = secret();
  if (!key) throw new Error("POST_ACCESS_SECRET_REQUIRED");
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = `${slug}:${postId}:${exp}`;
  const sig = createHmac("sha256", key).update(payload).digest("hex");
  return `${exp}.${sig}`;
}

function verifyToken(slug: string, postId: string, token: string): boolean {
  const key = secret();
  if (!key) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const payload = `${slug}:${postId}:${exp}`;
  const expected = createHmac("sha256", key).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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
