/**
 * 診斷 Google Ads OAuth（不輸出 secret 全文）
 * npx tsx --env-file=.env.local scripts/probe-google-ads-oauth.mjs
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { createDecipheriv, createHash } from "node:crypto";

config({ path: ".env.local" });

function getKey() {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("缺少 TOTP_ENCRYPTION_KEY");
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  return createHash("sha256").update(raw).digest();
}

function decryptSecret(encrypted) {
  const [ivHex, ciphertext] = encrypted.split(":");
  if (!ivHex || !ciphertext) throw new Error("密文格式無效");
  const decipher = createDecipheriv("aes-256-cbc", getKey(), Buffer.from(ivHex, "hex"));
  return decipher.update(ciphertext, "hex", "utf8") + decipher.final("utf8");
}

async function probe(clientId, clientSecret, refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return { status: res.status, body: await res.json() };
}

function mask(s) {
  if (!s) return "(empty)";
  if (s.length <= 8) return "***";
  return `${s.slice(0, 4)}…${s.slice(-4)} (${s.length} chars)`;
}

const prisma = new PrismaClient();

try {
  const row = await prisma.integrationCredential.findUnique({
    where: { provider: "google_ads" },
  });

  let values = {};
  if (row) {
    console.log("DB status:", row.status);
    console.log("DB lastError:", row.lastError ?? "(none)");
    try {
      values = JSON.parse(decryptSecret(row.payloadEncrypted));
    } catch (e) {
      console.log("DB decrypt failed:", e.message);
    }
  } else {
    console.log("DB: no google_ads row");
  }

  const clientId =
    values.GOOGLE_ADS_CLIENT_ID?.trim() ||
    process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const clientSecret =
    values.GOOGLE_ADS_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  const refreshToken =
    values.GOOGLE_ADS_REFRESH_TOKEN?.trim() ||
    process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim();

  console.log("\nFields present:");
  console.log("  CLIENT_ID:", mask(clientId));
  console.log("  CLIENT_SECRET:", mask(clientSecret));
  console.log("  REFRESH_TOKEN:", mask(refreshToken));
  console.log(
    "  DEVELOPER_TOKEN:",
    mask(values.GOOGLE_ADS_DEVELOPER_TOKEN || process.env.GOOGLE_ADS_DEVELOPER_TOKEN)
  );
  console.log(
    "  CUSTOMER_ID:",
    values.GOOGLE_ADS_CUSTOMER_ID || process.env.GOOGLE_ADS_CUSTOMER_ID || "(empty)"
  );

  if (!clientId || !clientSecret || !refreshToken) {
    console.log("\nFAIL: OAuth 三件套未齊（常見：Refresh Token 空白）");
    process.exit(1);
  }

  const { status, body } = await probe(clientId, clientSecret, refreshToken);
  console.log("\nToken exchange HTTP", status);
  if (body.access_token) {
    console.log("PASS: 可換取 access_token");
    process.exit(0);
  }
  console.log("FAIL:", body.error ?? "unknown");
  if (body.error_description) console.log("detail:", body.error_description);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
