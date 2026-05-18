import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { isPrismaMissingColumnError } from "@/lib/site/prisma-compat";
import type { HeroSlideData, HomeCarouselItemData, SiteLocale } from "@/lib/site/types";

type HeroSlideRow = {
  id: string;
  locale: string;
  title: string;
  subtitle: string | null;
  buttonLabel: string | null;
  buttonHref: string | null;
  imageUrl: string;
  imageAlt: string | null;
  textX: number;
  textY: number;
  sortOrder: number;
  isActive: boolean;
};

function mapHeroRow(slide: HeroSlideRow): HeroSlideData {
  return {
    id: slide.id,
    locale: slide.locale as SiteLocale,
    title: slide.title,
    subtitle: slide.subtitle ?? "",
    buttonLabel: slide.buttonLabel ?? "",
    buttonHref: slide.buttonHref ?? "",
    imageHref: "",
    imageUrl: slide.imageUrl,
    imageAlt: slide.imageAlt ?? "",
    textX: slide.textX,
    textY: slide.textY,
    sortOrder: slide.sortOrder,
    isActive: slide.isActive,
  };
}

export async function getHeroSlidesPrisma(
  locale: SiteLocale,
  includeInactive = false
): Promise<HeroSlideData[]> {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { locale, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 20,
    });

    return slides.map((slide) => {
      const s = slide as typeof slide & { imageHref?: string | null };
      return {
        id: slide.id,
        locale: slide.locale as SiteLocale,
        title: slide.title,
        subtitle: slide.subtitle ?? "",
        buttonLabel: slide.buttonLabel ?? "",
        buttonHref: slide.buttonHref ?? "",
        imageHref: s.imageHref ?? "",
        imageUrl: slide.imageUrl,
        imageAlt: slide.imageAlt ?? "",
        textX: slide.textX,
        textY: slide.textY,
        sortOrder: slide.sortOrder,
        isActive: slide.isActive,
      };
    });
  } catch (e) {
    if (!isPrismaMissingColumnError(e)) throw e;

    const rows = includeInactive
      ? await prisma.$queryRaw<HeroSlideRow[]>(Prisma.sql`
          SELECT id, locale, title, subtitle, "buttonLabel", "buttonHref", "imageUrl", "imageAlt",
                 "textX", "textY", "sortOrder", "isActive"
          FROM hero_slides
          WHERE locale = ${locale}
          ORDER BY "sortOrder" ASC, "createdAt" ASC
        `)
      : await prisma.$queryRaw<HeroSlideRow[]>(Prisma.sql`
          SELECT id, locale, title, subtitle, "buttonLabel", "buttonHref", "imageUrl", "imageAlt",
                 "textX", "textY", "sortOrder", "isActive"
          FROM hero_slides
          WHERE locale = ${locale} AND "isActive" = true
          ORDER BY "sortOrder" ASC, "createdAt" ASC
        `);

    return rows.map(mapHeroRow);
  }
}

export async function getHomeCarouselItemsPrisma(
  locale: SiteLocale,
  includeInactive = false
): Promise<HomeCarouselItemData[]> {
  const items = await prisma.homeCarouselItem.findMany({
    where: { locale, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 20,
  });

  return items.map((item) => ({
    id: item.id,
    locale: item.locale as SiteLocale,
    title: item.title,
    description: item.description ?? "",
    href: item.href ?? "",
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt ?? "",
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  }));
}
