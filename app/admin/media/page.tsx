import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/infrastructure/db/prisma";
import { getHeroSlides, getHomeCarouselItems } from "@/lib/site/hero-carousel-queries";
import { getSiteSettings } from "@/lib/site/queries";
import {
  classifyMediaStorage,
  type MediaLibraryItem,
} from "@/lib/admin/media-library";
import MediaLibraryManager from "@/components/admin/MediaLibraryManager";

export const metadata: Metadata = { title: "媒體庫 | Admin" };
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const [settings, heroZh, heroEn, carouselZh, carouselEn, postImages] = await Promise.all([
    getSiteSettings(),
    getHeroSlides("zh-TW", true),
    getHeroSlides("en", true),
    getHomeCarouselItems("zh-TW", true),
    getHomeCarouselItems("en", true),
    prisma.post.findMany({
      where: { coverImage: { not: null }, deletedAt: null },
      select: { id: true, title: true, coverImage: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  const items: MediaLibraryItem[] = [
    ...(settings.logoUrl
      ? [
          {
            title: settings.logoAlt || "LOGO",
            url: settings.logoUrl,
            source: "LOGO",
            sourceType: "logo" as const,
            storage: classifyMediaStorage(settings.logoUrl),
          },
        ]
      : []),
    ...[...heroZh, ...heroEn].map((slide) => ({
      title: slide.title,
      url: slide.imageUrl,
      source: `Hero ${slide.locale}`,
      sourceType: "hero" as const,
      entityId: slide.id,
      storage: classifyMediaStorage(slide.imageUrl),
    })),
    ...[...carouselZh, ...carouselEn].map((item) => ({
      title: item.title,
      url: item.imageUrl,
      source: `Carousel ${item.locale}`,
      sourceType: "carousel" as const,
      entityId: item.id,
      storage: classifyMediaStorage(item.imageUrl),
    })),
    ...postImages
      .filter((post): post is { id: string; title: string; coverImage: string } =>
        Boolean(post.coverImage)
      )
      .map((post) => ({
        title: post.title,
        url: post.coverImage,
        source: "Post cover",
        sourceType: "postCover" as const,
        entityId: post.id,
        storage: classifyMediaStorage(post.coverImage),
      })),
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">媒體庫</h1>
          <p className="mt-2 text-sm text-gray-500">
            集中檢視前台 CMS 與文章封面圖片。上傳請至「首頁版型」或文章編輯頁。
          </p>
        </div>
        <Link
          href="/admin/site"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          前往上傳圖片
        </Link>
      </div>

      <MediaLibraryManager items={items} />
    </div>
  );
}
