/**
 * 檢查 integration_credentials 內 GA4 私鑰是否可解析（不輸出私鑰）
 */
import { config } from "dotenv";
import { createPrivateKey } from "node:crypto";
import { prisma } from "../infrastructure/db/prisma.ts";
import { listIntegrationFormValues } from "../services/integrations/repository.ts";

config({ path: ".env.local" });

const vals = await listIntegrationFormValues();
const pk = vals.ga4?.GA4_PRIVATE_KEY?.trim();
if (!pk) {
  console.log("DB 無 GA4_PRIVATE_KEY");
  await prisma.$disconnect();
  process.exit(0);
}

let k = pk.replace(/\\n/g, "\n");
const b64 = (k.match(/-----BEGIN[^-]+-----([\s\S]*?)-----END/)?.[1] ?? "").replace(
  /\s/g,
  ""
);
let ok = false;
try {
  createPrivateKey(k);
  ok = true;
} catch {
  ok = false;
}
console.log("DB ga4 key:", { len: k.length, b64mod4: b64.length % 4, ok });
await prisma.$disconnect();
