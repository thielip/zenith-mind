// next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const isCfPublicOnly = process.env["CF_PUBLIC_ONLY"] === "1";

const nextConfig: NextConfig = {
  // GA4 / gRPC 僅能在 Node 跑；避免 webpack 打包後在 dev 出現詭異 gRPC 錯誤
  serverExternalPackages: [
    "@google-analytics/data",
    "google-gax",
    "@grpc/grpc-js",
    "jose",
    ...(isCfPublicOnly
      ? ["googleapis", "google-auth-library", "@google/generative-ai"]
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
    ...(isCfPublicOnly
      ? { optimizePackageImports: ["lucide-react"] }
      : {}),
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
    qualities: [75],
  },

  typescript: { ignoreBuildErrors: false },
  // TD-007：build 同步執行 ESLint（與 CI npm run lint 一致）
  eslint: { ignoreDuringBuilds: false },

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
        source: "/(.*)",
        headers: [{ key: "X-DNS-Prefetch-Control", value: "on" }],
      },
    ];
  },

  // 裸網域 → www：Cloudflare Redirect Rules（見 cloudflare/DASHBOARD_STEPS.txt）
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
    };
    return config;
  },
};

const configWithIntl = withNextIntl(nextConfig);

export default withSentryConfig(configWithIntl, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env["SENTRY_ORG"],

  project: process.env["SENTRY_PROJECT"],

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
