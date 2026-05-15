// lib/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales:       ["zh-TW", "en"],
  defaultLocale: "zh-TW",
  localePrefix:  "as-needed", // zh-TW 無前綴，en 加 /en/
});
