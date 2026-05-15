/** 建置階段是否可連線資料庫（Cloudflare 未注入 DATABASE_URL 時為 false） */
export function isDatabaseAvailable(): boolean {
  return Boolean(process.env["DATABASE_URL"]?.trim());
}
