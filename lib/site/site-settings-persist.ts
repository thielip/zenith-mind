import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { isPrismaMissingColumnError } from "@/lib/site/prisma-compat";
import { encodeLegalHtmlSections } from "@/lib/site/legal-storage";
import type { SiteSettingsData } from "@/lib/site/types";

export type SiteSettingsUpsertInput = {
  logoUrl: string | null;
  logoAlt: string;
  quickLinks: SiteSettingsData["quickLinks"];
  homepageCopy: SiteSettingsData["homepageCopy"];
  aboutSections: SiteSettingsData["aboutSections"];
  privacyPolicySections: SiteSettingsData["privacyPolicySections"];
  termsOfServiceSections: SiteSettingsData["termsOfServiceSections"];
  privacyPolicyHtml: string;
  privacyPolicyHtmlEn: string;
  termsOfServiceHtml: string;
  termsOfServiceHtmlEn: string;
  socialLinks: SiteSettingsData["socialLinks"];
  instagramEmbedUrl: string | null;
  socialSidebarActive: boolean;
  heroAutoplaySeconds: number;
  carouselAutoplaySeconds: number;
};

function asJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function buildCorePayload(data: SiteSettingsUpsertInput) {
  return {
    logoUrl: data.logoUrl,
    logoAlt: data.logoAlt,
    quickLinks: asJson(data.quickLinks),
    homepageCopy: asJson(data.homepageCopy),
    aboutSections: asJson(data.aboutSections),
    socialLinks: asJson(data.socialLinks),
    instagramEmbedUrl: data.instagramEmbedUrl,
    socialSidebarActive: data.socialSidebarActive,
    heroAutoplaySeconds: data.heroAutoplaySeconds,
    carouselAutoplaySeconds: data.carouselAutoplaySeconds,
  };
}

/** 寫入 site_settings；若 migration 未跑完會自動降級儲存法律頁 HTML */
export async function upsertSiteSettings(data: SiteSettingsUpsertInput): Promise<void> {
  const core = buildCorePayload(data);

  const fullPayload = {
    ...core,
    privacyPolicySections: asJson(data.privacyPolicySections),
    termsOfServiceSections: asJson(data.termsOfServiceSections),
    privacyPolicyHtml: data.privacyPolicyHtml,
    privacyPolicyHtmlEn: data.privacyPolicyHtmlEn,
    termsOfServiceHtml: data.termsOfServiceHtml,
    termsOfServiceHtmlEn: data.termsOfServiceHtmlEn,
  };

  try {
    await prisma.siteSettings.upsert({
      where: { id: "site" },
      create: { id: "site", ...fullPayload },
      update: fullPayload,
    });
    return;
  } catch (e) {
    if (!isPrismaMissingColumnError(e)) throw e;
  }

  const encodedPayload = {
    ...core,
    privacyPolicySections: asJson(
      encodeLegalHtmlSections(
        data.privacyPolicyHtml,
        data.privacyPolicyHtmlEn,
        data.privacyPolicySections
      )
    ),
    termsOfServiceSections: asJson(
      encodeLegalHtmlSections(
        data.termsOfServiceHtml,
        data.termsOfServiceHtmlEn,
        data.termsOfServiceSections
      )
    ),
  };

  try {
    await prisma.siteSettings.upsert({
      where: { id: "site" },
      create: { id: "site", ...encodedPayload },
      update: encodedPayload,
    });
    return;
  } catch (e) {
    if (!isPrismaMissingColumnError(e)) throw e;
  }

  await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: { id: "site", ...core },
    update: core,
  });
}
