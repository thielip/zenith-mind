import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "@/env";

function getKey(): Buffer {
  const raw = env.TOTP_ENCRYPTION_KEY.trim();
  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getKey(), iv);
  const encrypted =
    cipher.update(plaintext, "utf8", "hex") + cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptSecret(encrypted: string): string {
  const [ivHex, ciphertext] = encrypted.split(":");
  if (!ivHex || !ciphertext) {
    throw new Error("密文格式無效");
  }
  const decipher = createDecipheriv(
    "aes-256-cbc",
    getKey(),
    Buffer.from(ivHex, "hex")
  );
  return decipher.update(ciphertext, "hex", "utf8") + decipher.final("utf8");
}
