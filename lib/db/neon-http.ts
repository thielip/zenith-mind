/** Neon serverless SQL（fetch only，Edge / Worker 安全） */
import { neon } from "@neondatabase/serverless";

export function getNeonSql() {
  // Session / direct 連線較適合 serverless SQL 複雜查詢；transaction pooler 為後備
  const url =
    process.env["DIRECT_URL"]?.trim() ||
    process.env["DATABASE_URL"]?.trim();
  if (!url) return null;
  return neon(url);
}
