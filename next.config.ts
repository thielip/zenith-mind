// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  // Server Action 上傳圖檔：預設約 1MB 會截斷 FormData；需大於 infrastructure/storage 的 5MB 上限＋multipart 開銷
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
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
  eslint: { ignoreDuringBuilds: false },

  // 靜態安全標頭（Middleware 為主要注入點，此為備援）
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // SEO：www → non-www 永久轉址
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.zenith-mind.com" }],
        destination: "https://zenith-mind.com/:path*",
        permanent: true,
      },
    ];
  },

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
    return config;
  },
};

export default withNextIntl(nextConfig);
