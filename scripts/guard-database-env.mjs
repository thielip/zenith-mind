/**
 * 本機 Prisma 防呆：偵測 Supabase 連線並提示是否可能連到 production。
 * 強制對 production 執行 migrate 時需 ALLOW_PRODUCTION_DATABASE=1
 */
export function guardDatabaseEnv(prismaCommand) {
  const allow = process.env["ALLOW_PRODUCTION_DATABASE"] === "1";
  const url = process.env["DATABASE_URL"]?.trim() ?? "";
  const isSupabase =
    url.includes("supabase.com") || url.includes("pooler.supabase");

  if (!isSupabase) return;

  const isMigrate =
    prismaCommand.includes("migrate") ||
    prismaCommand.includes("db push") ||
    prismaCommand.includes("db pull");

  if (!isMigrate) {
    console.warn(
      "[db-guard] DATABASE_URL 指向 Supabase。若與 Production 為同一專案，本機 dev 會直接改動線上資料。"
    );
    return;
  }

  if (allow) {
    console.warn(
      "[db-guard] ALLOW_PRODUCTION_DATABASE=1：將對目前 DATABASE_URL 執行 migration（請確認目標正確）。"
    );
    return;
  }

  const destructive =
    prismaCommand.includes("migrate dev") ||
    prismaCommand.includes("migrate deploy") ||
    prismaCommand.includes("db push");

  if (destructive) {
    console.error(
      "\n[db-guard] 拒絕執行：偵測到 Supabase 連線且 Prisma 將變更 schema。\n" +
        "  - 本機開發請使用「Dev」Supabase 專案的 DATABASE_URL / DIRECT_URL\n" +
        "  - 若你確定要對目前這個 DB 執行，請在 .env.local 加上：ALLOW_PRODUCTION_DATABASE=1\n" +
        "  - 詳見 docs/DATABASE-ENVIRONMENTS.md\n"
    );
    process.exit(1);
  }
}
