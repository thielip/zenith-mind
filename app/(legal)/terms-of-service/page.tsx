import type { Metadata } from "next";
import { env } from "@/env";
import LegalHtmlArticle from "@/components/legal/LegalHtmlArticle";
import { LEGAL_PAGES } from "@/lib/legal/pages";
import { getSafeSiteSettings } from "@/lib/site/safe-site-settings";

export const revalidate = 86400;

const config = LEGAL_PAGES["terms-of-service"];

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const canonical = `${siteUrl}${config.path}`;
  return {
    title: `${config.metaTitleZh} (${config.metaTitleEn})`,
    description: `${config.metaDescZh} ${config.metaDescEn}`,
    alternates: {
      canonical,
      languages: {
        "zh-TW": canonical,
        en: canonical,
      },
    },
  };
}

export default async function TermsOfServicePage() {
  const siteSettings = await getSafeSiteSettings();

  return (
    <LegalHtmlArticle
      htmlZh={config.pickHtmlZh(siteSettings)}
      htmlEn={config.pickHtmlEn(siteSettings)}
      headingZh={config.defaultHeadingZh}
      headingEn={config.defaultHeadingEn}
      headingId="terms-of-service-heading"
    />
  );
}
