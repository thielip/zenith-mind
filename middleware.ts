// middleware.ts — Edge Runtime 入口
// 組合 lib/middleware/ 模組
// 執行順序：語系根路徑 → SEO 301 → IP Guard → Auth Guard → Security Headers

import { NextRequest, NextResponse } from "next/server";
import {
  buildAdminExternalUrl,
  shouldProxyAdminToExternal,
} from "@/lib/deploy/admin-origin";
import { isCloudflareProxiedRequest } from "@/lib/middleware/ip-guard";
import { adminAuthGuard } from "@/lib/middleware/auth-guard";
import { redirectGuard } from "@/lib/middleware/redirect-guard";
import { routing } from "@/lib/i18n/routing";
import { secureEarlyNextResponse } from "@/lib/middleware/apply-baseline-security-headers";
import {
  generateNonce,
  injectSecurityHeaders,
} from "@/lib/middleware/security-headers";
import { canonicalHostRedirect } from "@/lib/middleware/canonical-host-redirect";
import { resolveClientIpFromHeaders } from "@/lib/request/client-ip";
import { checkRateLimit, rateLimitKeyIp } from "@/lib/security/rate-limit";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const isProd = process.env["NODE_ENV"] === "production";
  const pathname = request.nextUrl.pathname;

  if (
    request.method === "POST" &&
    (pathname.startsWith("/api/auth/") || pathname === "/api/webhook")
  ) {
    const ip = resolveClientIpFromHeaders(request.headers);
    const routeKey = pathname.startsWith("/api/auth/") ? "auth:api" : "webhook";
    const rl = await checkRateLimit(rateLimitKeyIp(ip, routeKey), 30, 60);
    if (!rl.allowed) {
      return secureEarlyNextResponse(
        NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 })
      );
    }
  }

  // *.vercel.app / *.workers.dev 公開頁 → www（避免重複內容；/admin 除外）
  const canonicalRedirect = canonicalHostRedirect(request);
  if (canonicalRedirect) {
    return secureEarlyNextResponse(canonicalRedirect);
  }

  // Cloudflare 公開站：後台與後台 API 導向 Vercel（ADMIN_DEPLOYMENT_URL）
  if (shouldProxyAdminToExternal(pathname)) {
    const target = buildAdminExternalUrl(pathname, request.nextUrl.search);
    if (target) {
      return secureEarlyNextResponse(NextResponse.redirect(target, 302));
    }
  }

  // 根目錄導向預設語系（localePrefix: always → /zh-TW）
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}`;
    return secureEarlyNextResponse(NextResponse.redirect(url));
  }

  // ── Step 1：資料庫 301 轉址（封存文章舊 URL）──
  const redirectResponse = await redirectGuard(request);
  if (redirectResponse) return secureEarlyNextResponse(redirectResponse);

  // ── Step 2：Cloudflare 源站 IP 保護（僅 CF Worker；Vercel 直連不檢查）──
  const onVercel = Boolean(process.env["VERCEL"]);
  if (isProd && !onVercel && !isCloudflareProxiedRequest(request.headers)) {
    // 阻擋 workers.dev 直連等繞過 CF 代理的請求
    return secureEarlyNextResponse(new NextResponse(null, { status: 403 }));
  }

  // ── Step 3：Admin JWT 路由守衛（拆分部署時由 Vercel 處理）──
  if (!shouldProxyAdminToExternal(pathname)) {
    const authResponse = await adminAuthGuard(request);
    if (authResponse) return secureEarlyNextResponse(authResponse);
  }

  // ── Step 4：注入 nonce + 安全標頭 ────────────────────
  const nonce = generateNonce();

  // 將 nonce 傳給 Server Component（透過 request header）
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const nextResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // 注入安全標頭到 response
  const securedResponse = injectSecurityHeaders(nextResponse, nonce, isProd);
  return securedResponse as NextResponse;
}

// 與 lib/redirects/matcher.ts 互補：matcher 先擋靜態檔，redirectGuard 再擋 api/_next 等
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|google[0-9a-f]+\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|css|js|map)).*)",
  ],
};
