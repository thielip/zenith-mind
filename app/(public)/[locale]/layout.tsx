// app/(public)/[locale]/layout.tsx — Server Component（禁止 'use client'）
// Public locale layout：注入 nonce、GA4、i18n Provider、WCAG 基礎結構

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { routing } from "@/lib/i18n/routing";
import { env } from "@/env";
import ConsentBanner  from "@/components/analytics/ConsentBanner";
import Ga4Events      from "@/components/analytics/Ga4Events";
import SilentRefresh  from "@/components/analytics/SilentRefresh";
import SkipToMain     from "@/components/layout/SkipToMain";
import Header         from "@/components/layout/Header";
import Footer         from "@/components/layout/Footer";
import BackToTop      from "@/components/layout/BackToTop";
import SocialSidebar  from "@/components/layout/SocialSidebar";
import { buildOrganizationSchema } from "@/lib/seo/schemas/article.schema";
import JsonLd from "@/components/seo/JsonLd";
import { getSiteSettings } from "@/lib/site/queries";

interface Props {
  children: React.ReactNode;
  params:   Promise<{ locale: string }>;
}

export default async function PublicLocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const [messages, siteSettings] = await Promise.all([
    getMessages(),
    getSiteSettings(),
  ]);
  const h        = await headers();
  const nonce    = h.get("x-nonce") ?? "";
  const ga4Id    = env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const gtmId    = env.NEXT_PUBLIC_GTM_ID;
  const publicSiteSettings = {
    ...siteSettings,
    quickLinks: siteSettings.quickLinks.filter((link) => {
      const href = link.href.toLowerCase();
      return !href.includes("/admin") && !href.includes("#newsletter");
    }),
  };

  return (
    <>
        {/* WCAG：跳過導覽連結 */}
        <SkipToMain />

        {/* 首頁 Organization JSON-LD */}
        <JsonLd data={buildOrganizationSchema()} nonce={nonce} />

        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} settings={publicSiteSettings} />

          <main id="main-content" tabIndex={-1}>
            {children}
          </main>

          <SocialSidebar locale={locale} settings={publicSiteSettings} />
          <BackToTop locale={locale} />

          <Footer locale={locale} settings={publicSiteSettings} />

          {/* GDPR Consent Mode */}
          <ConsentBanner />

          {/* Token 靜默刷新（Admin 登入時啟動）*/}
          <SilentRefresh />
        </NextIntlClientProvider>

        {/* GTM：行銷可於容器內自行加碼（含 GA4 事件），不需改 repo */}
        {gtmId && <GoogleTagManager gtmId={gtmId} nonce={nonce} />}

        {/* GA4（lazyOnload 不阻塞 LCP；若僅用 GTM 載入 GA4 可省略此段）*/}
        {ga4Id && <GoogleAnalytics gaId={ga4Id} nonce={nonce} />}
        {ga4Id && <Ga4Events />}
    </>
  );
}
