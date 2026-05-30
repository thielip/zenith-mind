import { NextRequest, NextResponse } from "next/server";
import { isAdminDeploymentPath } from "@/lib/deploy/admin-origin";
import { getPublicSiteUrl } from "@/lib/site/url";

const ALT_HOST_SUFFIXES = [".vercel.app", ".workers.dev"] as const;

/** 非正式網域 → www.getzenithmind.com（避免 SEO 分散與 zenith-mind.com 522） */
const LEGACY_PUBLIC_HOSTS = new Set([
  "zenith-mind.com",
  "www.zenith-mind.com",
  "getzenithmind.com",
]);

function canonicalHostname(): string {
  try {
    return new URL(getPublicSiteUrl()).hostname.toLowerCase();
  } catch {
    return "www.getzenithmind.com";
  }
}

function shouldRedirectHost(host: string, canonical: string): boolean {
  if (!host || host === canonical) return false;
  if (ALT_HOST_SUFFIXES.some((s) => host.endsWith(s))) return true;
  return LEGACY_PUBLIC_HOSTS.has(host);
}

/**
 * 將鏡像／舊網域的「公開頁」301 到 NEXT_PUBLIC_SITE_URL，
 * 避免與 www 重複內容分散 SEO 權重。
 * 後台路徑不轉址（CF 會把 www/admin 導回 ADMIN_DEPLOYMENT_URL，避免迴圈）。
 */
export function canonicalHostRedirect(
  request: NextRequest
): NextResponse | null {
  if (process.env["NODE_ENV"] !== "production") return null;
  if (process.env["VERCEL_ENV"] === "preview") return null;

  const hostRaw =
    request.headers.get("host") ?? request.nextUrl.hostname ?? "";
  const host = hostRaw.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return null;

  const canonical = canonicalHostname();
  if (!shouldRedirectHost(host, canonical)) return null;

  const pathname = request.nextUrl.pathname;
  if (isAdminDeploymentPath(pathname)) return null;

  const canonicalOrigin = getPublicSiteUrl().replace(/\/$/, "");
  const target = new URL(
    `${pathname}${request.nextUrl.search}`,
    `${canonicalOrigin}/`
  );

  if (target.host === host) return null;

  return NextResponse.redirect(target, 301);
}
