import { isPrivateOrLocalIp } from "@/lib/request/client-ip";

const cache = new Map<string, string | null>();

export async function countryLabelForIp(ip: string): Promise<string | null> {
  const normalized = ip.trim();
  if (!normalized || isPrivateOrLocalIp(normalized)) {
    return normalized === "unknown" ? null : "本機／內網";
  }

  if (cache.has(normalized)) return cache.get(normalized) ?? null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://ipapi.co/${encodeURIComponent(normalized)}/country_name/`,
      { signal: controller.signal, next: { revalidate: 86400 } }
    );
    clearTimeout(timer);
    if (!res.ok) {
      cache.set(normalized, null);
      return null;
    }
    const name = (await res.text()).trim();
    const label = name && name !== "Undefined" ? name : null;
    cache.set(normalized, label);
    return label;
  } catch {
    cache.set(normalized, null);
    return null;
  }
}

export async function batchCountryLabels(
  ips: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(ips.filter((ip) => ip && !isPrivateOrLocalIp(ip)))];
  const entries = await Promise.all(
    unique.map(async (ip) => {
      const country = await countryLabelForIp(ip);
      return country ? ([ip, country] as const) : null;
    })
  );
  return new Map(entries.filter((e): e is [string, string] => e !== null));
}
