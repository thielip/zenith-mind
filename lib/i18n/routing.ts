// lib/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales:       ["zh-TW", "en"],
  defaultLocale: "zh-TW",
  localePrefix:  "always", // 與 /zh-TW、middleware、sitemap 一致；避免 as-needed 與 [locale] 路由衝突
});
