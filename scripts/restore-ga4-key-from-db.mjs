/**
 * 從 integration_credentials（ga4）還原 GA4_PRIVATE_KEY 至 .env.local
 * 當 .env 私鑰損壞但整合中心曾儲存正確金鑰時使用。
 * npx tsx --env-file=.env.local scripts/restore-ga4-key-from-db.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createPrivateKey } from "node:crypto";
import { config } from "dotenv";
import { prisma } from "../infrastructure/db/prisma.ts";
import { listIntegrationFormValues } from "../services/integrations/repository.ts";

config({ path: ".env.local" });

const vals = await listIntegrationFormValues();
const email = vals.ga4?.GA4_CLIENT_EMAIL?.trim();
const pk = vals.ga4?.GA4_PRIVATE_KEY?.trim();

if (!email || !pk) {
  console.error("DB 中 ga4 整合無 GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY");
  await prisma.$disconnect();
  process.exit(1);
}

const pem = pk.replace(/\\n/g, "\n");
try {
  createPrivateKey(pem);
} catch (e) {
  console.error("DB 內私鑰亦無法解析:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
}

const envPath = ".env.local";
if (!existsSync(envPath)) {
  console.error("找不到 .env.local");
  process.exit(1);
}

const escaped = pem.replace(/\n/g, "\\n");
let content = readFileSync(envPath, "utf8");

function setKey(name, value) {
  const line =
    value.includes(" ") || value.includes("\\n") ? `${name}="${value}"` : `${name}=${value}`;
  const re = new RegExp(`^${name}=.*(?:\\n(?!\\w+=).*)*`, "m");
  if (re.test(content)) content = content.replace(re, line);
  else content = content.trimEnd() + `\n${line}\n`;
}

setKey("GA4_CLIENT_EMAIL", email);
setKey("GA4_PRIVATE_KEY", escaped);
writeFileSync(envPath, content.endsWith("\n") ? content : `${content}\n`);

console.log("已從 DB 還原 GA4 服務帳號至 .env.local:", email);
console.log("請執行：npm run ga4:sync-vercel && npm run ga4:sync-cf");

await prisma.$disconnect();
