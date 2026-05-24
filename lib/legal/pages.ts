import type { SiteSettingsData } from "@/lib/site/types";

export type LegalPageKey = "privacy-policy" | "terms-of-service";

export const LEGAL_PAGES: Record<
  LegalPageKey,
  {
    path: string;
    defaultHeadingZh: string;
    defaultHeadingEn: string;
    metaTitleZh: string;
    metaTitleEn: string;
    metaDescZh: string;
    metaDescEn: string;
    pickHtmlZh: (settings: SiteSettingsData) => string;
    pickHtmlEn: (settings: SiteSettingsData) => string;
  }
> = {
  "privacy-policy": {
    path: "/privacy-policy",
    defaultHeadingZh: "隱私權政策",
    defaultHeadingEn: "Privacy Policy",
    metaTitleZh: "隱私權政策",
    metaTitleEn: "Privacy Policy",
    metaDescZh:
      "了解巔峰思維如何收集、使用與保護您的個人資料，以及如何要求刪除資料。",
    metaDescEn:
      "Learn how Zenith Mind collects, uses, and protects your personal data, and how to request deletion.",
    pickHtmlZh: (s) => s.privacyPolicyHtml,
    pickHtmlEn: (s) => s.privacyPolicyHtmlEn,
  },
  "terms-of-service": {
    path: "/terms-of-service",
    defaultHeadingZh: "服務條款",
    defaultHeadingEn: "Terms of Service",
    metaTitleZh: "服務條款",
    metaTitleEn: "Terms of Service",
    metaDescZh:
      "使用巔峰思維網站的規則、免責聲明、智慧財產權與終止服務相關說明。",
    metaDescEn:
      "Rules for using Zenith Mind, disclaimers, intellectual property, and termination.",
    pickHtmlZh: (s) => s.termsOfServiceHtml,
    pickHtmlEn: (s) => s.termsOfServiceHtmlEn,
  },
};
