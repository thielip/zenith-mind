/** 已知失效或禁止 hotlink 的圖床 host（CMS 外部圖片 URL） */
const BLOCKED_IMAGE_HOSTS = new Set([
  "duk.tw",
  "i.duk.tw",
]);

export function isBlockedImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (BLOCKED_IMAGE_HOSTS.has(host)) return true;
  return [...BLOCKED_IMAGE_HOSTS].some(
    (blocked) => host === blocked || host.endsWith(`.${blocked}`)
  );
}
