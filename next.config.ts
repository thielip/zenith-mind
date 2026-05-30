// next.config.ts
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

// CF_PUBLIC_ONLY：cf-public-build / build:next:public 明確設定
// SKIP_ENV_VALIDATION + 非 Vercel：Dashboard「SKIP_ENV_VALIDATION=true npm run build:cf」備援
// CF_PAGES：Cloudflare Pages 自動注入
const isCfPublicOnly =
  process.env["CF_PUBLIC_ONLY"] === "1" ||
  process.env["CF_PAGES"] === "1" ||
  (process.env["SKIP_ENV_VALIDATION"] === "true" &&
    process.env["VERCEL"] !== "1");
const sentryAuthToken = process.env["SENTRY_AUTH_TOKEN"]?.trim();
const sentryUploadEnabled = Boolean(
  sentryAuthToken &&
    process.env["SENTRY_ORG"]?.trim() &&
    process.env["SENTRY_PROJECT"]?.trim()
);

const nextConfig: NextConfig = {
  // GA4 / gRPC 僅能在 Node 跑；避免 webpack 打包後在 dev 出現詭異 gRPC 錯誤
  serverExternalPackages: [
    "@google-analytics/data",
    "google-gax",
    "@grpc/grpc-js",
    "jose",
    ...(isCfPublicOnly
      ? [
          "googleapis",
          "google-auth-library",
          "@google/generative-ai",
          "@prisma/client",
          "@prisma/client/edge",
          "@prisma/adapter-neon",
          "sanitize-html",
        ]
      : []),
  ],

  // 本機用區網 IP 開 admin（例：192.168.0.x:3000）時避免 dev 跨來源與 middleware 載入異常
  allowedDevOrigins: [
    "192.168.0.128",
    "192.168.0.126",
  ],

  // Server Action 上傳圖檔：預設約 1MB 會截斷 FormData；需大於 infrastructure/storage 的 5MB 上限＋multipart 開銷
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tabs",
    ],
  },

  images: {
    remotePatterns: [
      // Next.js 需使用 `**` 才會比對任意子網域；`*.supabase.co` 不會生效，導致 Supabase Storage 圖片在 next/image 報錯
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
      {
        protocol: "https",
        hostname: "www.getzenithmind.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "getzenithmind.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1400, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    // 須涵蓋全站 next/image 的 quality（見 lib/images/hero-presets、Header、ImageCarousel 等）
    qualities: [52, 54, 72, 75],
  },

  // Vercel 全站：build 跑 tsc + ESLint（CI 亦執行 type-check / lint）
  // CF 公開站：略過 build 內 tsc/ESLint，避免 Pages 2GB heap OOM（見 cf-public-build）
  typescript: { ignoreBuildErrors: isCfPublicOnly },
  eslint: { ignoreDuringBuilds: isCfPublicOnly },

  // 僅 DNS prefetch；X-Content-Type-Options 等由 middleware 單一注入（避免重複值導致掃描失敗）
  async headers() {
    return [
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/logo.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [{ key: "X-DNS-Prefetch-Control", value: "on" }],
      },
    ];
  },

  // 裸網域 → www：Cloudflare Redirect Rules（見 docs/operations/cloudflare-dashboard-steps.txt）
  // *.vercel.app 公開頁 → www：middleware `canonical-host-redirect`（/admin 除外，避免與 CF 迴圈）
  // 勿在此寫 has:host redirects：OpenNext on Workers 可能異常；Vercel 亦由 middleware 統一處理。

  webpack(config) {
    // 確保 Node-only 模組不進入 Edge bundle
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "pg-native": false,
      ...(isCfPublicOnly
        ? {
            "@/infrastructure/db/prisma": path.join(
              configDir,
              "infrastructure/db/prisma-public-stub.ts"
            ),
          }
        : {}),
    };
    return config;
  },
};

const configWithIntl = withNextIntl(nextConfig);

const sentryBuildOptions = {
  org: process.env["SENTRY_ORG"],
  project: process.env["SENTRY_PROJECT"],
  authToken: sentryAuthToken,
  silent: !sentryUploadEnabled,
  sourcemaps: { disable: !sentryUploadEnabled },
  widenClientFileUpload: sentryUploadEnabled,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: { removeDebugLogging: true },
  },
} as const;

/** CF 公開站略過 withSentryConfig，避免注入瀏覽器 SDK（chunk 431 / 長任務） */
export default isCfPublicOnly
  ? configWithIntl
  : withSentryConfig(configWithIntl, sentryBuildOptions);
