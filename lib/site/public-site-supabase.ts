/**
 * 公開站資料（Cloudflare Worker）：僅 Supabase PostgREST + fetch。
 * 禁止 import @/infrastructure/db/prisma。
 */
import { supabasePublishedVisibilityAnd } from "@/lib/blog/public-post-visibility";
import { PUBLIC_READ_CACHE_TAGS } from "@/lib/public-content/cache-tags";
import {
  supabaseCount,
  supabaseRest,
  supabaseRestWithFallback,
} from "@/lib/db/supabase-rest";
import {
  DEFAULT_SITE_SETTINGS,
  mapSiteSettingsRow,
  type SiteSettingsDbRow,
} from "@/lib/site/queries";
import type { AdSlotPublic } from "@/lib/site/ad-slots";
import type {
  HeroSlideData,
  HomeCarouselItemData,
  SiteLocale,
  SiteSettingsData,
} from "@/lib/site/types";

type FeaturedPostRow = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  publishedAt: string | null;
  readingTime: number | null;
  categories: { name: string; nameEn: string | null; slug: string } | null;
};

type AffiliateRow = {
  name: string;
  slug: string;
  platform: string | null;
  commission: string | null;
};

type HeroSlideRow = {
  id: string;
  locale: string;
  title: string;
  subtitle: string | null;
  buttonLabel: string | null;
  buttonHref: string | null;
  imageHref: string | null;
  imageUrl: string;
  imageAlt: string | null;
  textX: number;
  textY: number;
  sortOrder: number;
  isActive: boolean;
};

type CarouselRow = {
  id: string;
  locale: string;
  title: string;
  description: string | null;
  href: string | null;
  imageUrl: string;
  imageAlt: string | null;
  sortOrder: number;
  isActive: boolean;
};

type AdSlotRow = {
  id: string;
  slotKey: string;
  locale: string;
  name: string;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAlt: string;
  blurHash: string | null;
  href: string | null;
  aspectRatio: string | null;
  priority: number;
};

function mapFeaturedPost(row: FeaturedPostRow) {
  const cat = row.categories;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.titleEn,
    excerpt: row.excerpt,
    excerptEn: row.excerptEn,
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
    readingTime: row.readingTime ?? 0,
    category: cat
      ? { name: cat.name, nameEn: cat.nameEn, slug: cat.slug }
      : null,
  };
}

function mapHeroSlide(row: HeroSlideRow): HeroSlideData {
  return {
    id: row.id,
    locale: row.locale as SiteLocale,
    title: row.title,
    subtitle: row.subtitle ?? "",
    buttonLabel: row.buttonLabel ?? "",
    buttonHref: row.buttonHref ?? "",
    imageHref: row.imageHref ?? "",
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt ?? "",
    textX: row.textX,
    textY: row.textY,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

function mapCarouselItem(row: CarouselRow): HomeCarouselItemData {
  return {
    id: row.id,
    locale: row.locale as SiteLocale,
    title: row.title,
    description: row.description ?? "",
    href: row.href ?? "",
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt ?? "",
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

function mapAdSlot(row: AdSlotRow): AdSlotPublic {
  return {
    id: row.id,
    slotKey: row.slotKey,
    locale: row.locale,
    name: row.name,
    imageUrl: row.imageUrl,
    imageWidth: row.imageWidth,
    imageHeight: row.imageHeight,
    imageAlt: row.imageAlt,
    blurHash: row.blurHash,
    href: row.href,
    aspectRatio: row.aspectRatio,
    priority: row.priority,
  };
}

export async function getSiteSettingsViaSupabase(): Promise<SiteSettingsData> {
  const rows = await supabaseRestWithFallback<SiteSettingsDbRow[]>(
    "site_settings",
    {
      select:
        "logoUrl,logoAlt,quickLinks,socialLinks,homepageCopy,aboutSections,privacyPolicySections,termsOfServiceSections,privacyPolicyHtml,privacyPolicyHtmlEn,termsOfServiceHtml,termsOfServiceHtmlEn,instagramEmbedUrl,socialSidebarActive,heroAutoplaySeconds,carouselAutoplaySeconds",
      id: "eq.site",
      limit: "1",
    },
    [],
    undefined,
    { kind: "public", revalidate: 3600, tags: ["site-settings"] }
  );
  const row = rows[0];
  if (!row) return DEFAULT_SITE_SETTINGS;
  return mapSiteSettingsRow(row);
}

export async function fetchFeaturedPostsViaSupabase() {
  const rows = await supabaseRest<FeaturedPostRow[]>(
    "posts",
    {
      select:
        "id,slug,title,titleEn,excerpt,excerptEn,publishedAt,readingTime,categories(name,nameEn,slug)",
      and: supabasePublishedVisibilityAnd(),
      order: "publishedAt.desc,createdAt.desc",
      limit: "6",
    },
    undefined,
    {
      kind: "public",
      revalidate: 3600,
      tags: [...PUBLIC_READ_CACHE_TAGS.posts],
    }
  );
  return rows.map(mapFeaturedPost);
}

export async function fetchAffiliateLinksViaSupabase() {
  const rows = await supabaseRest<AffiliateRow[]>("affiliate_links", {
    select: "name,slug,platform,commission",
    isActive: "eq.true",
    order: "createdAt.desc",
    limit: "6",
  });
  return rows;
}

export async function countPublishedPostsViaSupabase(): Promise<number> {
  return supabaseCount(
    "posts",
    { and: supabasePublishedVisibilityAnd() },
    {
      kind: "public",
      revalidate: 3600,
      tags: [...PUBLIC_READ_CACHE_TAGS.posts],
    }
  );
}

export async function countCategoriesViaSupabase(): Promise<number> {
  return supabaseCount("categories", { deletedAt: "is.null" });
}

export async function countHomePageViewsViaSupabase(
  locale: SiteLocale
): Promise<number> {
  const { fetchSiteViewTotal } = await import("@/lib/analytics/post-view-totals");
  return fetchSiteViewTotal(locale);
}

export async function getHeroSlidesViaSupabase(
  locale: SiteLocale,
  includeInactive = false
): Promise<HeroSlideData[]> {
  const params: Record<string, string> = {
    select:
      "id,locale,title,subtitle,buttonLabel,buttonHref,imageHref,imageUrl,imageAlt,textX,textY,sortOrder,isActive",
    locale: `eq.${locale}`,
    order: "sortOrder.asc,createdAt.asc",
    limit: "20",
  };
  if (!includeInactive) params.isActive = "eq.true";

  const rows = await supabaseRestWithFallback<HeroSlideRow[]>(
    "hero_slides",
    params,
    [],
    undefined,
    { kind: "public", revalidate: 3600, tags: ["hero-slides"] }
  );
  return rows.map(mapHeroSlide);
}

export async function getHomeCarouselItemsViaSupabase(
  locale: SiteLocale,
  includeInactive = false
): Promise<HomeCarouselItemData[]> {
  const params: Record<string, string> = {
    select:
      "id,locale,title,description,href,imageUrl,imageAlt,sortOrder,isActive",
    locale: `eq.${locale}`,
    order: "sortOrder.asc,createdAt.asc",
    limit: "20",
  };
  if (!includeInactive) params.isActive = "eq.true";

  const rows = await supabaseRestWithFallback<CarouselRow[]>(
    "home_carousel_items",
    params,
    [],
    undefined,
    { kind: "public", revalidate: 3600, tags: ["home-carousel"] }
  );
  return rows.map(mapCarouselItem);
}

export async function getActiveAdSlotViaSupabase(
  slotKey: string,
  locale: SiteLocale
): Promise<AdSlotPublic | null> {
  const base = {
    select:
      "id,slotKey,locale,name,imageUrl,imageWidth,imageHeight,imageAlt,blurHash,href,aspectRatio,priority",
    slotKey: `eq.${slotKey}`,
    isActive: "eq.true",
    order: "priority.asc,createdAt.desc",
    limit: "1",
  };

  for (const loc of [locale, "all"] as const) {
    const rows = await supabaseRestWithFallback<AdSlotRow[]>(
      "ad_slots",
      {
        ...base,
        locale: `eq.${loc}`,
      },
      []
    );
    const row = rows[0];
    if (row) return mapAdSlot(row);
  }

  return null;
}
