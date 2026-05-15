import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/site/url";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: {
    template: "%s | 巔峰思維 Zenith Mind",
    default: "巔峰思維 Zenith Mind — AI 思維 × 投資理財 × 個人品牌",
  },
  description:
    "巔峰思維，透過 AI 工具、投資理財、量化交易、房地產知識，幫助你建立財富思維，加速實現財務自由。",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "巔峰思維 Zenith Mind",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
