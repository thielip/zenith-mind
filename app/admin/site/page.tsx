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
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Frontend CMS
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">首頁版型與全站組件</h1>
        <p className="mt-2 text-sm text-gray-500">
          管理 LOGO、快速導覽、Hero Slider、小圖輪播、社群側邊欄與前台預覽。
        </p>
      </div>

      <SiteCmsManager
        initialSettings={settings}
        initialHeroSlides={{ "zh-TW": heroZh, en: heroEn }}
        initialCarouselItems={{ "zh-TW": carouselZh, en: carouselEn }}
      />
    </div>
  );
}
