// middleware.ts — Edge Runtime 入口
// 組合 lib/middleware/ 模組
// 執行順序：語系根路徑 → SEO 301 → IP Guard → Auth Guard → Security Headers

import { NextRequest, NextResponse } from "next/server";
import { isCloudflareIP } from "@/lib/middleware/ip-guard";
import { adminAuthGuard } from "@/lib/middleware/auth-guard";
import { redirectGuard } from "@/lib/middleware/redirect-guard";
import { routing } from "@/lib/i18n/routing";
import {
  generateNonce,
  injectSecurityHeaders,
} from "@/lib/middleware/security-headers";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const isProd = process.env["NODE_ENV"] === "production";
  const pathname = request.nextUrl.pathname;

  // 根目錄導向預設語系首頁（/ -> /zh-TW）
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}`;
    return NextResponse.redirect(url);
  }

  // ── Step 1：資料庫 301 轉址（封存文章舊 URL）──
  const redirectResponse = await redirectGuard(request);
  if (redirectResponse) return redirectResponse;

  // ── Step 2：Cloudflare 源站 IP 保護（僅 production）──
  if (isProd) {
    const cfIp = request.headers.get("CF-Connecting-IP") ?? "";
    if (!isCloudflareIP(cfIp)) {
      // 403，不暴露原因
      return new NextResponse(null, { status: 403 });
    }
  }

  // ── Step 3：Admin JWT 路由守衛 ────────────────────────
  const authResponse = await adminAuthGuard(request);
  if (authResponse) return authResponse;

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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|css|js|map)).*)",
  ],
};
