/**
 * 將 GOOGLE_ADS_* 寫入 integration_credentials 並驗證 OAuth
 * npx tsx --env-file=.env.local scripts/upsert-google-ads-from-env.mjs
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

config({ path: ".env.local" });

function getKey() {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("缺少 TOTP_ENCRYPTION_KEY");
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  return createHash("sha256").update(raw).digest();
}

function encryptSecret(plaintext) {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", getKey(), iv);
  const encrypted =
    cipher.update(plaintext, "utf8", "hex") + cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decryptSecret(encrypted) {
  const [ivHex, ciphertext] = encrypted.split(":");
  const decipher = createDecipheriv("aes-256-cbc", getKey(), Buffer.from(ivHex, "hex"));
  return decipher.update(ciphertext, "hex", "utf8") + decipher.final("utf8");
}

const KEYS = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
];

const prisma = new PrismaClient();

try {
  const row = await prisma.integrationCredential.findUnique({
    where: { provider: "google_ads" },
  });
  let values = {};
  if (row) {
    try {
      values = JSON.parse(decryptSecret(row.payloadEncrypted));
    } catch {
      /* ignore */
    }
  }

  for (const key of KEYS) {
    const fromEnv = process.env[key]?.trim();
    if (fromEnv) values[key] = fromEnv;
  }

  const missing = KEYS.filter((k) => !values[k]?.trim());
  if (missing.length) {
    console.error("缺少欄位:", missing.join(", "));
    process.exit(1);
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: values.GOOGLE_ADS_CLIENT_ID,
      client_secret: values.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: values.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json();
  if (!body.access_token) {
    console.error("OAuth 驗證失敗:", body.error, body.error_description ?? "");
    process.exit(1);
  }

  await prisma.integrationCredential.upsert({
    where: { provider: "google_ads" },
    create: {
      provider: "google_ads",
      payloadEncrypted: encryptSecret(JSON.stringify(values)),
      status: "CONNECTED",
      lastVerifiedAt: new Date(),
      lastError: null,
    },
    update: {
      payloadEncrypted: encryptSecret(JSON.stringify(values)),
      status: "CONNECTED",
      lastVerifiedAt: new Date(),
      lastError: null,
    },
  });

  console.log("OK: google_ads 已寫入 DB 並標記 CONNECTED");
} finally {
  await prisma.$disconnect();
}
