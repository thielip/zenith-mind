// lib/middleware/ip-guard.ts — Edge Runtime
// Cloudflare 源站 IP 保護
// CIDR 清單 build-time 靜態嵌入，禁止 runtime fetch

// 完整清單：https://www.cloudflare.com/ips-v4（每季至少更新一次）
const CF_CIDRS = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22",
  "103.31.4.0/22",   "141.101.64.0/18", "108.162.192.0/18",
  "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22",
  "198.41.128.0/17", "162.158.0.0/15",  "104.16.0.0/13",
  "104.24.0.0/14",   "172.64.0.0/13",   "131.0.72.0/22",
] as const;

/** 手寫 IPv4 CIDR 判斷（零套件依賴，Edge 完全相容）*/
function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr = "32"] = cidr.split("/");
  if (!range) return false;
  const bits = parseInt(bitsStr, 10);
  const mask = bits === 0 ? 0 : ~((1 << (32 - bits)) - 1);
  const toInt = (addr: string) =>
    addr.split(".").reduce((a, b) => (a << 8) + parseInt(b, 10), 0);
  return (
    (toInt(ip) >>> 0 & mask >>> 0) === (toInt(range) >>> 0 & mask >>> 0)
  );
}

export function isCloudflareIP(ip: string): boolean {
  if (!ip) return false;
  return CF_CIDRS.some((cidr) => ipInCidr(ip, cidr));
}
