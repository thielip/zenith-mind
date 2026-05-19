/**
 * GSC API 的 siteUrl 必須與 Search Console 資源字串完全一致。
 * @see https://developers.google.com/webmaster-tools/v1/sites
 */
export function normalizeGscSiteUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("sc-domain:")) {
    return trimmed;
  }

  let url = trimmed;
  if (!url.includes("://")) {
    url = `https://${url}`;
  }

  try {
    const u = new URL(url);
    if (u.pathname === "/" || u.pathname === "") {
      return `${u.origin}/`;
    }
    const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
    return `${u.origin}${path}`;
  } catch {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }
}
