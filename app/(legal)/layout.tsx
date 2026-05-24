// 法律頁面（無語系前綴）：/privacy-policy、/terms-of-service
import { headers } from "next/headers";
import { getSafeSiteSettings } from "@/lib/site/safe-site-settings";
import PublicSiteShell from "@/components/layout/PublicSiteShell";

export const revalidate = 3600;

function resolveFooterLocale(acceptLanguage: string | null): "zh-TW" | "en" {
  const raw = (acceptLanguage ?? "").toLowerCase();
  if (!raw) return "zh-TW";
  const parts = raw.split(",").map((p) => p.trim().split(";")[0] ?? "");
  for (const part of parts) {
    if (part.startsWith("en")) return "en";
    if (part.startsWith("zh")) return "zh-TW";
  }
  return "zh-TW";
}

export default async function LegalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await getSafeSiteSettings();
  const h = await headers();
  const locale = resolveFooterLocale(h.get("accept-language"));

  return (
    <PublicSiteShell locale={locale} siteSettings={siteSettings}>
      {children}
    </PublicSiteShell>
  );
}
