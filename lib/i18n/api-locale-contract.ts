/**
 * 多語系 API 輸出契約（平鋪式 DB：title / titleEn）
 * 對外 JSON 統一帶 current + translations，避免前端直接耦合欄位命名。
 */
export interface LocalizedStringDto {
  current: string;
  translations: {
    "zh-TW": string;
    en: string;
  };
}

export function toLocalizedStringDto(
  zh: string,
  en: string | null | undefined,
  locale: "zh-TW" | "en"
): LocalizedStringDto {
  const enVal = (en ?? "").trim();
  return {
    current: locale === "en" ? (enVal || zh) : zh,
    translations: {
      "zh-TW": zh,
      en: enVal,
    },
  };
}
