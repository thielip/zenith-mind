/**
 * 已知常發生防盜連／無法 hotlink 的圖床（僅後台警告，不阻擋儲存）。
 * 若需永久封鎖，請改由 CDN 上傳或 Supabase Storage。
 */
const HOTLINK_UNRELIABLE_HOSTS = new Set([
  "duk.tw",
  "i.duk.tw",
]);

export const UNRELIABLE_IMAGE_HOST_HINT =
  "此圖床常無法在外站直接顯示（防盜連）。若前台看不到圖，請改上傳至媒體庫或改用其他網址。";

export function isBlockedImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (HOTLINK_UNRELIABLE_HOSTS.has(host)) return true;
  return [...HOTLINK_UNRELIABLE_HOSTS].some(
    (blocked) => host === blocked || host.endsWith(`.${blocked}`)
  );
}
