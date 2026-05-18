// lib/middleware/security-headers.ts — Edge Runtime
// CSP nonce 產生 + 完整安全標頭注入

import { applyBaselineSecurityHeaders } from "@/lib/middleware/apply-baseline-security-headers";

/** 使用 Edge Web Crypto API 產生 nonce（非 Node.js crypto 模組）*/
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // btoa 在 Edge Runtime 可用
  return btoa(String.fromCharCode(...array));
}

function buildCsp(nonce: string, isProd: boolean): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(!isProd ? ["'unsafe-eval'"] : []),
  ].join(" ");
  const styleSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    ...(!isProd ? ["'unsafe-inline'"] : []),
  ].join(" ");

  const directives: Record<string, string> = {
    "default-src": "'self'",

    // strict-dynamic：信任 nonce 載入的 script 及其子載入（GA/GTM 相容）
    "script-src": scriptSrc,
    "style-src":  styleSrc,
    "style-src-elem": styleSrc,
    // next/image、Hero 浮層定位等需 style 屬性；hash 無法涵蓋 CMS 動態座標
    "style-src-attr": "'unsafe-inline'",

    // 圖片：允許 Supabase Storage + data URI
    "img-src": "'self' data: https:",

    // 字型：自托管
    "font-src": "'self'",

    // connect-src：必須列出所有外部端點，漏填導致 Analytics 靜默失效
    "connect-src": [
      "'self'",
      "https://*.google-analytics.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://c.clarity.ms",         // Clarity 數據上傳（必填）
      "https://www.clarity.ms",
      "https://region.upstash.io",    // Upstash Redis
      "*.supabase.co",                // Supabase
    ].join(" "),

    "require-trusted-types-for": "'script'",
    "trusted-types": "default",

    "frame-src": [
      "'self'",
      "https://www.facebook.com",
      "https://www.youtube.com",
      "https://www.instagram.com",
    ].join(" "),

    "form-action":    "'self'",
    "frame-ancestors": "'none'",
    "object-src":     "'none'",
    "base-uri":       "'self'",

    ...(isProd ? { "upgrade-insecure-requests": "" } : {}),
  };

  return Object.entries(directives)
    .map(([k, v]) => (v ? `${k} ${v}` : k))
    .join("; ");
}

export function injectSecurityHeaders(
  response: Response,
  nonce: string,
  isProd: boolean
): Response {
  const headers = new Headers(response.headers);

  if (isProd) {
    headers.set("Content-Security-Policy", buildCsp(nonce, isProd));
  } else {
    headers.delete("Content-Security-Policy");
  }
  applyBaselineSecurityHeaders(headers);

  // nonce 傳遞給 Server Component（讀取 headers()）
  headers.set("x-nonce", nonce);

  return new Response(response.body, { ...response, headers });
}
