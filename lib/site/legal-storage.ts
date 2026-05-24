import type { AboutSectionData } from "@/lib/site/types";

/** 當 DB 尚無 Text 欄位時，將 HTML 暫存於 JSON 段落 */
export const LEGAL_HTML_SECTION_ID = "__legal_html__";

export function encodeLegalHtmlSections(
  html: string,
  htmlEn: string,
  fallbackSections: AboutSectionData[]
): AboutSectionData[] {
  const zh = html.trim();
  const en = htmlEn.trim();
  if (!zh && !en) return fallbackSections;
  return [
    {
      id: LEGAL_HTML_SECTION_ID,
      title: "",
      titleEn: "",
      body: zh,
      bodyEn: en,
      sortOrder: 0,
    },
  ];
}

export function decodeLegalHtmlSections(sections: AboutSectionData[]): {
  html: string;
  htmlEn: string;
  sections: AboutSectionData[];
} {
  const slot = sections.find((s) => s.id === LEGAL_HTML_SECTION_ID);
  if (!slot) {
    return { html: "", htmlEn: "", sections };
  }
  return {
    html: slot.body,
    htmlEn: slot.bodyEn ?? "",
    sections: sections.filter((s) => s.id !== LEGAL_HTML_SECTION_ID),
  };
}
