// lib/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;
  const valid  = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${valid}.json`)) as {
    default: Record<string, unknown>;
  };

  return { locale: valid, messages: messages.default };
});
