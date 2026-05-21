/** 是否允許使用 next/image（需在 next.config remotePatterns 白名單內） */
export function isNextImageRemoteUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname.endsWith(".supabase.co")) return true;
    if (hostname === "www.getzenithmind.com" || hostname === "getzenithmind.com") {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
