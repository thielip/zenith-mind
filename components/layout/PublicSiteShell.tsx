import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import ConsentGatedAnalytics from "@/components/analytics/ConsentGatedAnalytics";
import PerformanceResourceHints from "@/components/seo/PerformanceResourceHints";
import { env } from "@/env";
import ConsentBanner from "@/components/analytics/ConsentBanner";
import SkipToMain from "@/components/layout/SkipToMain";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  DeferredBackToTop,
  DeferredSocialSidebar,
} from "@/components/layout/client-deferred-widgets";
import { buildOrganizationSchema } from "@/lib/seo/schemas/article.schema";
import JsonLd from "@/components/seo/JsonLd";
import type { SiteSettingsData } from "@/lib/site/types";

interface Props {
  locale: string;
  siteSettings: SiteSettingsData;
  children: React.ReactNode;
}

export default async function PublicSiteShell({
  locale,
  siteSettings,
  children,
}: Props) {
  let messages: Awaited<ReturnType<typeof getMessages>> = {};
  try {
    messages = await getMessages();
  } catch {
    messages = {};
  }

  const h = await headers();
  const nonce = h.get("x-nonce") ?? "";
  const ga4Id = env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const gtmId = env.NEXT_PUBLIC_GTM_ID;
  const publicSiteSettings = {
    ...siteSettings,
    quickLinks: siteSettings.quickLinks.filter((link) => {
      const href = link.href.toLowerCase();
      return !href.includes("/admin");
    }),
  };

  return (
    <>
      <PerformanceResourceHints />
      <SkipToMain />
      <JsonLd data={buildOrganizationSchema()} nonce={nonce} />

      <NextIntlClientProvider messages={messages}>
        <Header locale={locale} settings={publicSiteSettings} />

        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        <DeferredSocialSidebar locale={locale} settings={publicSiteSettings} />
        <DeferredBackToTop locale={locale} />

        <Footer locale={locale} settings={publicSiteSettings} />

        <ConsentBanner />
      </NextIntlClientProvider>

      <ConsentGatedAnalytics ga4Id={ga4Id} gtmId={gtmId} nonce={nonce} />
    </>
  );
}
