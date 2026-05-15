import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/infrastructure/db/prisma";
import { getHeroSlides, getHomeCarouselItems } from "@/lib/site/hero-carousel-queries";
import { getSiteSettings } from "@/lib/site/queries";
import MediaDeleteButton from "@/components/admin/MediaDeleteButton";

export const metadata: Metadata = { title: "媒體庫 | Admin" };
export const dynamic = "force-dynamic";

interface MediaItem {
  title: string;
  url: string;
  source: string;
  sourceType: "logo" | "hero" | "carousel" | "postCover";
  entityId?: string;
}

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

  const items: MediaItem[] = [
    ...(settings.logoUrl
      ? [{
          title: settings.logoAlt || "LOGO",
          url: settings.logoUrl,
          source: "LOGO",
          sourceType: "logo" as const,
        }]
      : []),
    ...[...heroZh, ...heroEn].map((slide) => ({
      title: slide.title,
      url: slide.imageUrl,
      source: `Hero ${slide.locale}`,
      sourceType: "hero" as const,
      entityId: slide.id,
    })),
    ...[...carouselZh, ...carouselEn].map((item) => ({
      title: item.title,
      url: item.imageUrl,
      source: `Carousel ${item.locale}`,
      sourceType: "carousel" as const,
      entityId: item.id,
    })),
    ...postImages
      .filter((post): post is { id: string; title: string; coverImage: string } => Boolean(post.coverImage))
      .map((post) => ({
        title: post.title,
        url: post.coverImage,
        source: "Post cover",
        sourceType: "postCover" as const,
        entityId: post.id,
      })),
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">媒體庫</h1>
          <p className="mt-2 text-sm text-gray-500">
            集中檢視目前前台 CMS 與文章封面使用中的圖片。上傳請至「首頁版型」或文章編輯頁操作。
          </p>
        </div>
        <a
          href="/admin/site"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          前往上傳圖片
        </a>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          尚無媒體資料。
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <article key={`${item.url}-${index}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative h-44 bg-gray-100">
                <Image
                  src={item.url}
                  alt={item.title}
                  fill
                  unoptimized={item.url.endsWith(".svg")}
                  sizes="(min-width: 1280px) 20rem, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                  {item.source}
                </p>
                <h2 className="mt-1 line-clamp-1 text-sm font-semibold text-gray-900">{item.title}</h2>
                <p className="mt-2 break-all text-xs text-gray-400">{item.url}</p>
                <div className="mt-4 flex justify-end">
                  <MediaDeleteButton
                    source={item.sourceType}
                    url={item.url}
                    entityId={item.entityId}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
