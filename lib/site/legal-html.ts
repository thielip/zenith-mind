import type { AboutSectionData } from "@/lib/site/types";
import {
  DEFAULT_PRIVACY_POLICY_SECTIONS,
  DEFAULT_TERMS_OF_SERVICE_SECTIONS,
} from "@/lib/site/legal-defaults";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 將舊版段落 JSON 轉為 HTML（遷移／fallback） */
export function sectionsToHtml(
  sections: AboutSectionData[],
  locale: "zh" | "en"
): string {
  const parts: string[] = [];
  for (const section of sections) {
    const title =
      locale === "en"
        ? section.titleEn?.trim() || section.title
        : section.title;
    const body =
      locale === "en"
        ? section.bodyEn?.trim() || section.body
        : section.body;
    if (title) parts.push(`<h2>${escapeHtml(title)}</h2>`);
    for (const paragraph of body.split("\n").filter(Boolean)) {
      parts.push(`<p>${escapeHtml(paragraph)}</p>`);
    }
  }
  return parts.join("") || "<p></p>";
}

export const DEFAULT_PRIVACY_POLICY_HTML = sectionsToHtml(
  DEFAULT_PRIVACY_POLICY_SECTIONS,
  "zh"
);
export const DEFAULT_PRIVACY_POLICY_HTML_EN = sectionsToHtml(
  DEFAULT_PRIVACY_POLICY_SECTIONS,
  "en"
);
export const DEFAULT_TERMS_OF_SERVICE_HTML = sectionsToHtml(
  DEFAULT_TERMS_OF_SERVICE_SECTIONS,
  "zh"
);
export const DEFAULT_TERMS_OF_SERVICE_HTML_EN = sectionsToHtml(
  DEFAULT_TERMS_OF_SERVICE_SECTIONS,
  "en"
);

export function resolveLegalHtml(
  html: string | null | undefined,
  htmlEn: string | null | undefined,
  sections: AboutSectionData[],
  locale: "zh" | "en"
): string {
  const primary = locale === "en" ? htmlEn : html;
  if (primary?.trim()) return primary.trim();
  if (sections.length > 0) return sectionsToHtml(sections, locale);
  const secondary = locale === "en" ? html : htmlEn;
  if (secondary?.trim()) return secondary.trim();
  return "<p></p>";
}
