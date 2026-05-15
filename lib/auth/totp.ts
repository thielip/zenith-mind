// lib/auth/totp.ts — Node Runtime Only
// speakeasy TOTP + AES-256-CBC 加密儲存 secret
// ⚠ speakeasy 使用 Node.js crypto，禁止在 Edge 引入

import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "@/env";

function getKey(): Buffer {
  const raw = env.TOTP_ENCRYPTION_KEY.trim();
  const hexKey = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : null;
  return hexKey ?? createHash("sha256").update(raw).digest();
}

/** AES-256-CBC 加密（存 DB 前呼叫）回傳格式：iv:ciphertext（hex:hex）*/
export function encryptTotpSecret(plaintext: string): string {
  const iv  = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getKey(), iv);
  const encrypted = cipher.update(plaintext, "utf8", "hex") + cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/** AES-256-CBC 解密（驗證前呼叫）*/
export function decryptTotpSecret(encrypted: string): string {
  const [ivHex, ciphertext] = encrypted.split(":");
  if (!ivHex || !ciphertext) throw new Error("Invalid encrypted TOTP secret");
  const decipher = createDecipheriv(
    "aes-256-cbc",
    getKey(),
    Buffer.from(ivHex, "hex")
  );
  return decipher.update(ciphertext, "hex", "utf8") + decipher.final("utf8");
}

/** 產生新的 TOTP secret（初次設定）*/
export async function generateTotpSecret(email: string): Promise<{
  base32:     string;
  encrypted:  string;
  qrCodeUrl:  string;
}> {
  const secret = speakeasy.generateSecret({
    name:   `巔峰思維 (${email})`,
    length: 32,
  });

  if (!secret.base32 || !secret.otpauth_url) {
    throw new Error("Failed to generate TOTP secret");
  }

  return {
    base32:    secret.base32,
    encrypted: encryptTotpSecret(secret.base32),
    qrCodeUrl: await qrcode.toDataURL(secret.otpauth_url),
  };
}

/** 驗證使用者輸入的 6 位數 TOTP */
export function verifyTotpToken(encryptedSecret: string, token: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret:   decryptTotpSecret(encryptedSecret),
      encoding: "base32",
      token,
      window:   1, // 允許前後 30 秒誤差
    });
  } catch {
    return false;
  }
}
