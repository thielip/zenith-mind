// app/(public)/[locale]/layout.tsx — Server Component（禁止 'use client'）

import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import PublicSiteShell from "@/components/layout/PublicSiteShell";
import { getSafeSiteSettings } from "@/lib/site/safe-site-settings";

/** 與子頁 revalidate 一致；版型設定透過 unstable_cache + tag 失效 */
export const revalidate = 3600;

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function PublicLocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const siteSettings = await getSafeSiteSettings();

  return (
    <PublicSiteShell locale={locale} siteSettings={siteSettings}>
      {children}
    </PublicSiteShell>
  );
}
