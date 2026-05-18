// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const isCfPublicOnly = process.env["CF_PUBLIC_ONLY"] === "1";

const nextConfig: NextConfig = {
  // GA4 / gRPC 僅能在 Node 跑；避免 webpack 打包後在 dev 出現詭異 gRPC 錯誤
  serverExternalPackages: [
    "@google-analytics/data",
    "google-gax",
    "@grpc/grpc-js",
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
    ],
    formats: ["image/avif", "image/webp"],
  },

  typescript: { ignoreBuildErrors: false },
  // CI / Cloudflare 建置：lint 在 npm run lint 執行，避免 build 因 parser 設定失敗
  eslint: { ignoreDuringBuilds: true },

  // 僅 DNS prefetch；X-Content-Type-Options 等由 middleware 單一注入（避免重複值導致掃描失敗）
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [{ key: "X-DNS-Prefetch-Control", value: "on" }],
      },
    ];
  },

  // 裸網域 → www 請只在 Cloudflare Redirect Rules 設定（見 cloudflare/DASHBOARD_STEPS.txt）。
  // 勿在此寫 redirects()：OpenNext on Workers 可能無法正確套用 has:host，
  // 會把 destination 的 `:path*` 當字面路徑，導致 www 全站 308 迴圈（Location: /:path*）。

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

export default withNextIntl(nextConfig);
