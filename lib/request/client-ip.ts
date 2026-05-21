/**
 * 從反向代理 Headers 解析訪客真實 IP（Vercel / Cloudflare / 一般代理）
 */
export function resolveClientIpFromHeaders(
  headers: Pick<Headers, "get">
): string {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("CF-Connecting-IP"),
    headers.get("x-real-ip"),
    headers.get("x-vercel-forwarded-for"),
    headers.get("x-forwarded-for"),
  ];

  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    const first = raw.split(",")[0]?.trim();
    if (first && first !== "unknown") return normalizeIp(first);
  }

  return "unknown";
}

function normalizeIp(ip: string): string {
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

export function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip || ip === "unknown") return true;
  if (ip === "masked" || ip.includes("***")) return true;
  if (ip === "::1" || ip === "127.0.0.1" || ip === "localhost") return true;
  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^fc00:|^fe80:/i.test(ip)) return true;
  return false;
}
