/**
 * 顯示目前載入的 DB 連線 host（不輸出密碼）
 * 用法：node --env-file=.env.local scripts/db-connection-info.mjs
 */
function hostFromUrl(name) {
  const raw = process.env[name]?.trim();
  if (!raw) return { name, present: false, host: null, port: null };
  try {
    const u = new URL(raw);
    return {
      name,
      present: true,
      host: u.hostname,
      port: u.port || (u.protocol === "postgresql:" ? "5432" : ""),
    };
  } catch {
    return { name, present: true, host: "(invalid URL)", port: null };
  }
}

const rows = [hostFromUrl("DATABASE_URL"), hostFromUrl("DIRECT_URL")];
const sameHost =
  rows[0].host &&
  rows[1].host &&
  rows[0].host === rows[1].host;

console.log(
  JSON.stringify(
    {
      nodeEnv: process.env.NODE_ENV ?? "(unset)",
      connections: rows,
      sameSupabasePoolerHost: sameHost,
      hint:
        "若本機 host 與 Vercel Production 相同，代表共用同一 Supabase 專案。開發建議改用 Dev 專案連線字串。",
    },
    null,
    2
  )
);
