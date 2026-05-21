import type { Metadata } from "next";
import SiteCmsManager from "@/components/admin/SiteCmsManager";
import { getHeroSlides, getHomeCarouselItems } from "@/lib/site/hero-carousel-queries";
import { getSiteSettings } from "@/lib/site/queries";

export const metadata: Metadata = { title: "首頁版型 CMS | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSitePage() {
  const [settings, heroZh, heroEn, carouselZh, carouselEn] = await Promise.all([
    getSiteSettings(),
    getHeroSlides("zh-TW", true),
    getHeroSlides("en", true),
    getHomeCarouselItems("zh-TW", true),
    getHomeCarouselItems("en", true),
  ]);

  return (
    <div>
      <SiteCmsManager
        initialSettings={settings}
        initialHeroSlides={{ "zh-TW": heroZh, en: heroEn }}
        initialCarouselItems={{ "zh-TW": carouselZh, en: carouselEn }}
      />
    </div>
  );
}
