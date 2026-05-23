/**
 * 生產環境 seed 護欄（P0）
 * 用法：import { assertSeedAllowed } from "./lib/assert-seed-allowed.mjs";
 */

export function assertSeedAllowed(scriptName) {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const vercelEnv = process.env.VERCEL_ENV ?? "";
  const nodeEnv = process.env.NODE_ENV ?? "";
  const tier = (process.env.SEED_TIER ?? "demo").trim().toLowerCase();

  const looksProduction =
    vercelEnv === "production" ||
    nodeEnv === "production" ||
    /supabase\.co/i.test(dbUrl);

  if (!looksProduction) return;

  if (process.env.ALLOW_PRODUCTION_SEED !== "1") {
    console.error(
      `[${scriptName}] 拒絕在疑似 production 環境執行。` +
        "請確認 DATABASE_URL，或設定 ALLOW_PRODUCTION_SEED=1 後再執行。"
    );
    process.exit(1);
  }

  if (tier === "minimal") {
    console.error(
      `[${scriptName}] SEED_TIER=minimal 不允許執行含 deleteMany 的 CMS seed。`
    );
    process.exit(1);
  }
}
