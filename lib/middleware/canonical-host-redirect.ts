import { NextRequest, NextResponse } from "next/server";
import { shouldProxyAdminToExternal } from "@/lib/deploy/admin-origin";
import { getPublicSiteUrl } from "@/lib/site/url";

const ALT_HOST_SUFFIXES = [".vercel.app", ".workers.dev"] as const;

/**
 * 將 Vercel / workers.dev 鏡像網域的「公開頁」301 到 NEXT_PUBLIC_SITE_URL，
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
  if (!ALT_HOST_SUFFIXES.some((s) => host.endsWith(s))) return null;

  const pathname = request.nextUrl.pathname;
  if (shouldProxyAdminToExternal(pathname)) return null;

  const canonicalOrigin = getPublicSiteUrl().replace(/\/$/, "");
  const target = new URL(
    `${pathname}${request.nextUrl.search}`,
    `${canonicalOrigin}/`
  );

  if (target.host === host) return null;

  return NextResponse.redirect(target, 301);
}
