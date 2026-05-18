"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { writeAuditLog } from "@/infrastructure/db/adapters/audit.prisma-adapter";
import { uploadSiteAsset } from "@/infrastructure/storage/supabase-storage";
import { gateAdminWrite } from "@/lib/auth/resolve-admin-action";
import { sanitizeText } from "@/lib/sanitize/html";
import { getHeroSlides, getHomeCarouselItems } from "@/lib/site/hero-carousel-queries";
import { asHomepageCopy, getSiteSettings } from "@/lib/site/queries";
import type {
  HeroSlideData,
  HomeCarouselItemData,
  SiteSettingsData,
} from "@/lib/site/types";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

const localeSchema = z.enum(["zh-TW", "en"]);

/** 外部連結常漏寫協定，導致 z.string().url() 失敗；/ 與 # 開頭維持原樣 */
function normalizeHttpUrl(value: string): string {
  const v = value.trim();
  if (!v) return v;
  if (v.startsWith("/") || v.startsWith("#")) return v;
  if (v.startsWith("//")) return `https:${v}`;
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

const hrefSchema = z
  .string()
  .trim()
  .max(300)
  .transform(normalizeHttpUrl)
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/") || value.startsWith("#")) return true;
      return z.string().url().safeParse(value).success;
    },
    { message: "Invalid href" }
  );

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (!v ? "" : v.startsWith("/") || v.startsWith("#") ? v : normalizeHttpUrl(v)))
  .refine((value) => !value || z.string().url().safeParse(value).success, "Invalid URL");

const assetUrlSchema = z
  .string()
  .trim()
  .max(500)
  .transform((v) => {
    if (!v) return v;
    if (v.startsWith("/")) return v;
    return normalizeHttpUrl(v);
  })
  .refine(
    (value) => {
      if (!value) return false;
      if (value.startsWith("/")) return true;
      return z.string().url().safeParse(value).success;
    },
    { message: "Invalid image URL" }
  );

const quickLinkSchema = z.object({
  label: z.string().trim().min(1).max(40),
  labelEn: z.string().trim().max(40).optional().default(""),
  href: hrefSchema,
});

const localizedTextBlockSchema = z.object({
  title: z.string().trim().max(120).default(""),
  titleEn: z.string().trim().max(120).default(""),
  description: z.string().trim().max(500).default(""),
  descriptionEn: z.string().trim().max(500).default(""),
});

const topicClusterSlugSchema = z.enum([
  "international",
  "finance",
  "ai-tech",
  "education",
  "lifestyle",
  "other",
]);

const topicClusterCardSchema = z.object({
  slug: topicClusterSlugSchema,
  name: z.string().trim().max(40),
  nameEn: z.string().trim().max(80),
  description: z.string().trim().max(400),
  descriptionEn: z.string().trim().max(400),
});

const homepageCopySchema = z.object({
  socialProof: z.object({
    eyebrow: z.string().trim().max(80),
    eyebrowEn: z.string().trim().max(80),
    title: z.string().trim().max(200),
    titleEn: z.string().trim().max(200),
    lead: z.string().trim().max(400),
    leadEn: z.string().trim().max(400),
    statPostsLabel: z.string().trim().max(80),
    statPostsLabelEn: z.string().trim().max(80),
    statTopicsLabel: z.string().trim().max(80),
    statTopicsLabelEn: z.string().trim().max(80),
    statViewsLabel: z.string().trim().max(100),
    statViewsLabelEn: z.string().trim().max(100),
    badges: z.array(z.string().trim().max(48)).length(4),
    badgesEn: z.array(z.string().trim().max(48)).length(4),
  }),
  topicClusters: z.object({
    eyebrow: z.string().trim().max(80),
    eyebrowEn: z.string().trim().max(80),
    title: z.string().trim().max(200),
    titleEn: z.string().trim().max(200),
    viewAll: z.string().trim().max(80),
    viewAllEn: z.string().trim().max(80),
    explore: z.string().trim().max(80),
    exploreEn: z.string().trim().max(80),
    cards: z.array(topicClusterCardSchema).length(6),
  }),
  visualCarousel: z.object({
    eyebrow: z.string().trim().max(80),
    eyebrowEn: z.string().trim().max(80),
    title: z.string().trim().max(200),
    titleEn: z.string().trim().max(200),
    description: z.string().trim().max(400),
    descriptionEn: z.string().trim().max(400),
  }),
  featuredPosts: z.object({
    eyebrow: z.string().trim().max(80),
    eyebrowEn: z.string().trim().max(80),
    title: z.string().trim().max(200),
    titleEn: z.string().trim().max(200),
    browseAll: z.string().trim().max(80),
    browseAllEn: z.string().trim().max(80),
    minRead: z.string().trim().max(40),
    minReadEn: z.string().trim().max(40),
  }),
  monetization: z.object({
    eyebrow: z.string().trim().max(80),
    eyebrowEn: z.string().trim().max(80),
    title: z.string().trim().max(160),
    titleEn: z.string().trim().max(160),
    description: z.string().trim().max(600),
    descriptionEn: z.string().trim().max(600),
    items: z.array(localizedTextBlockSchema).max(8),
  }),
  affiliate: z.object({
    eyebrow: z.string().trim().max(80),
    eyebrowEn: z.string().trim().max(80),
    title: z.string().trim().max(160),
    titleEn: z.string().trim().max(160),
    description: z.string().trim().max(600),
    descriptionEn: z.string().trim().max(600),
  }),
  programmaticSeo: z.object({
    eyebrow: z.string().trim().max(80),
    eyebrowEn: z.string().trim().max(80),
    title: z.string().trim().max(160),
    titleEn: z.string().trim().max(160),
    description: z.string().trim().max(600),
    descriptionEn: z.string().trim().max(600),
    buttonLabel: z.string().trim().max(40),
    buttonLabelEn: z.string().trim().max(40),
    strategies: z.array(localizedTextBlockSchema).max(8),
  }),
  conversionBanner: z.object({
    eyebrow: z.string().trim().max(80),
    eyebrowEn: z.string().trim().max(80),
    title: z.string().trim().max(180),
    titleEn: z.string().trim().max(180),
    description: z.string().trim().max(700),
    descriptionEn: z.string().trim().max(700),
    ctaLabel: z.string().trim().max(48),
    ctaLabelEn: z.string().trim().max(48),
    ctaHref: hrefSchema.default("#affiliate-links"),
  }),
});

const aboutSectionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().max(120).default(""),
  titleEn: z.string().trim().max(120).default(""),
  body: z.string().trim().max(3000).default(""),
  bodyEn: z.string().trim().max(3000).default(""),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

const siteSettingsSchema = z.object({
  logoUrl: z.string().trim().max(500).refine((value) => {
    if (!value) return true;
    if (value.startsWith("/")) return true;
    return z.string().url().safeParse(value).success;
  }, "Invalid logo URL"),
  logoAlt: z.string().trim().max(80).default("Zenith Mind"),
  quickLinks: z.array(quickLinkSchema).max(14).default([]),
  homepageCopy: homepageCopySchema,
  aboutSections: z.array(aboutSectionSchema).max(12).default([]),
  socialLinks: z.object({
    facebookPageUrl: optionalUrlSchema.default(""),
    youtubeChannelUrl: optionalUrlSchema.default(""),
    instagramUrl: optionalUrlSchema.default(""),
    lineUrl: optionalUrlSchema.default(""),
    lineLabel: z.string().trim().max(40).default("官方帳號"),
  }),
  instagramEmbedUrl: optionalUrlSchema.default(""),
  socialSidebarActive: z.boolean().default(false),
  heroAutoplaySeconds: z.coerce.number().int().min(0).max(120).default(8),
  carouselAutoplaySeconds: z.coerce.number().int().min(0).max(120).default(6),
});

const heroSlideSchema = z.object({
  locale: localeSchema,
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(240).default(""),
  buttonLabel: z.string().trim().max(40).default(""),
  buttonHref: hrefSchema.default(""),
  imageHref: hrefSchema.default(""),
  imageUrl: assetUrlSchema,
  imageAlt: z.string().trim().max(120).default(""),
  textX: z.coerce.number().int().min(0).max(100).default(12),
  textY: z.coerce.number().int().min(0).max(100).default(50),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

const carouselItemSchema = z.object({
  locale: localeSchema,
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(180).default(""),
  href: hrefSchema.default(""),
  imageUrl: assetUrlSchema,
  imageAlt: z.string().trim().max(120).default(""),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

async function getMeta() {
  const h = await headers();
  return {
    ip: h.get("CF-Connecting-IP") ?? "unknown",
    userAgent: h.get("user-agent") ?? "",
    requestId: crypto.randomUUID(),
  };
}

function revalidatePublicPages() {
  revalidateTag("site-settings");
  revalidatePath("/zh-TW", "layout");
  revalidatePath("/en", "layout");
  revalidatePath("/zh-TW", "page");
  revalidatePath("/en", "page");
  revalidatePath("/", "layout");
}

export async function uploadSiteAssetAction(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const meta = await getMeta();

  try {
    const gate = await gateAdminWrite("site");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

    const raw = formData.get("file");
    const folder = String(formData.get("folder") ?? "cms");
    const clientName = String(formData.get("clientFileName") ?? "").trim();

    let file: File | null = null;
    if (raw instanceof File && raw.size > 0) {
      file = raw;
    } else if (raw instanceof Blob && raw.size > 0) {
      const name =
        clientName ||
        (raw.type === "image/png"
          ? "upload.png"
          : raw.type === "image/webp"
            ? "upload.webp"
            : raw.type === "image/gif"
              ? "upload.gif"
              : "upload.jpg");
      file = new File([raw], name, { type: raw.type || "application/octet-stream" });
    }
    if (!file || file.size === 0) {
      return { success: false, data: null, error: Errors.validation("Missing image file") };
    }

    const url = await uploadSiteAsset(file, folder);
    void writeAuditLog({
      action: "CREATE",
      entityType: "SiteAsset",
      metadata: { folder, url },
      userId: admin.userId,
      ...meta,
    });

    return { success: true, data: { url }, error: null };
  } catch (e: unknown) {
    console.error(`[Site] upload error [${meta.requestId}]:`, e);
    const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
    const lower = msg.toLowerCase();

    if (msg === "UNSUPPORTED_IMAGE_TYPE" || lower.includes("unsupported_image_type")) {
      return {
        success: false,
        data: null,
        error: Errors.validation({
          formErrors: [
            "不支援的圖片格式。請使用 JPG、PNG、WebP、AVIF 或 SVG；若已選正確檔案仍失敗，請確認檔名含副檔名（例如 .png），或改用其他瀏覽器再試。",
          ],
        }),
      };
    }
    if (
      msg === "IMAGE_TOO_LARGE" ||
      lower.includes("image_too_large") ||
      lower.includes("exceeded") ||
      lower.includes("too large") ||
      lower.includes("payload too large") ||
      lower.includes("request entity too large")
    ) {
      return {
        success: false,
        data: null,
        error: Errors.validation({
          formErrors: [
            "圖片超過上限（後台單檔 5MB；若仍失敗請確認 next.config 已設定 serverActions.bodySizeLimit）。請壓縮後再上傳。",
          ],
        }),
      };
    }
    if (lower.includes("jwt") || lower.includes("invalid api key") || lower.includes("unauthorized")) {
      return {
        success: false,
        data: null,
        error: Errors.validation({
          formErrors: [
            "Supabase 認證失敗：請檢查 SUPABASE_SERVICE_ROLE_KEY 與 NEXT_PUBLIC_SUPABASE_URL 是否與專案一致。",
          ],
        }),
      };
    }
    if (lower.includes("bucket") && lower.includes("not found")) {
      return {
        success: false,
        data: null,
        error: Errors.validation({
          formErrors: ["Storage bucket `site-assets` 不存在或無權限。請在 Supabase Storage 建立公開 bucket 或檢查 Service Role。"],
        }),
      };
    }
    return {
      success: false,
      data: null,
      error: Errors.validation({
        formErrors: [`上傳失敗：${msg.slice(0, 280)}`],
      }),
    };
  }
}

export async function updateSiteSettingsAction(
  input: unknown
): Promise<ActionResult<SiteSettingsData>> {
  const meta = await getMeta();

  try {
    const gate = await gateAdminWrite("site");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

    const inputRecord = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    const parsed = siteSettingsSchema.safeParse({
      ...inputRecord,
      homepageCopy: asHomepageCopy(inputRecord["homepageCopy"]),
    });
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const data = parsed.data;
    await prisma.siteSettings.upsert({
      where: { id: "site" },
      create: {
        id: "site",
        logoUrl: data.logoUrl || null,
        logoAlt: sanitizeText(data.logoAlt),
        quickLinks: data.quickLinks.map((link) => ({
          label: sanitizeText(link.label),
          labelEn: sanitizeText(link.labelEn ?? ""),
          href: link.href,
        })),
        homepageCopy: data.homepageCopy,
        aboutSections: data.aboutSections,
        socialLinks: {
          ...data.socialLinks,
          lineLabel: sanitizeText(data.socialLinks.lineLabel || "官方帳號"),
        },
        instagramEmbedUrl: data.instagramEmbedUrl || null,
        socialSidebarActive: data.socialSidebarActive,
        heroAutoplaySeconds: data.heroAutoplaySeconds,
        carouselAutoplaySeconds: data.carouselAutoplaySeconds,
      },
      update: {
        logoUrl: data.logoUrl || null,
        logoAlt: sanitizeText(data.logoAlt),
        quickLinks: data.quickLinks.map((link) => ({
          label: sanitizeText(link.label),
          labelEn: sanitizeText(link.labelEn ?? ""),
          href: link.href,
        })),
        homepageCopy: data.homepageCopy,
        aboutSections: data.aboutSections,
        socialLinks: {
          ...data.socialLinks,
          lineLabel: sanitizeText(data.socialLinks.lineLabel || "官方帳號"),
        },
        instagramEmbedUrl: data.instagramEmbedUrl || null,
        socialSidebarActive: data.socialSidebarActive,
        heroAutoplaySeconds: data.heroAutoplaySeconds,
        carouselAutoplaySeconds: data.carouselAutoplaySeconds,
      },
    });

    void writeAuditLog({
      action: "UPDATE",
      entityType: "SiteSettings",
      entityId: "site",
      userId: admin.userId,
      ...meta,
    });

    revalidatePublicPages();
    return { success: true, data: await getSiteSettings(), error: null };
  } catch (e: unknown) {
    console.error(`[Site] settings error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

export async function saveHeroSlidesAction(
  locale: unknown,
  input: unknown
): Promise<ActionResult<HeroSlideData[]>> {
  const meta = await getMeta();

  try {
    const gate = await gateAdminWrite("site");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

    const parsedLocale = localeSchema.safeParse(locale);
    if (!parsedLocale.success) {
      return {
        success: false,
        data: null,
        error: Errors.validation(parsedLocale.error.flatten()),
      };
    }

    const parsedSlides = z.array(heroSlideSchema).max(12).safeParse(input);
    if (!parsedSlides.success) {
      return {
        success: false,
        data: null,
        error: Errors.validation(parsedSlides.error.flatten()),
      };
    }

    const slides: Prisma.HeroSlideCreateManyInput[] = parsedSlides.data.map((slide, index) => ({
      locale: parsedLocale.data,
      title: sanitizeText(slide.title),
      subtitle: sanitizeText(slide.subtitle).trim() || null,
      buttonLabel: sanitizeText(slide.buttonLabel).trim() || null,
      buttonHref: slide.buttonHref.trim() || null,
      imageHref: slide.imageHref.trim() || null,
      imageUrl: slide.imageUrl.trim(),
      imageAlt: sanitizeText(slide.imageAlt).trim() || null,
      textX: slide.textX,
      textY: slide.textY,
      sortOrder: index,
      isActive: slide.isActive,
    }));

    await prisma.$transaction(async (tx) => {
      await tx.heroSlide.deleteMany({ where: { locale: parsedLocale.data } });
      if (slides.length > 0) {
        await tx.heroSlide.createMany({ data: slides });
      }
    });

    void writeAuditLog({
      action: "UPDATE",
      entityType: "HeroSlide",
      metadata: { locale: parsedLocale.data, count: slides.length },
      userId: admin.userId,
      ...meta,
    });

    revalidateTag("hero-slides");
    revalidatePublicPages();
    return { success: true, data: await getHeroSlides(parsedLocale.data, true), error: null };
  } catch (e: unknown) {
    console.error(`[Site] hero slides error [${meta.requestId}]:`, e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        data: null,
        error: Errors.validation({
          formErrors: [`${e.code}: ${e.message}`],
        }),
      };
    }
    if (e instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        data: null,
        error: Errors.validation({ formErrors: [e.message] }),
      };
    }
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

export async function saveHomeCarouselItemsAction(
  locale: unknown,
  input: unknown
): Promise<ActionResult<HomeCarouselItemData[]>> {
  const meta = await getMeta();

  try {
    const gate = await gateAdminWrite("site");
    if (!gate.ok) return gate.result;
    const admin = gate.session;

    const parsedLocale = localeSchema.safeParse(locale);
    if (!parsedLocale.success) {
      return {
        success: false,
        data: null,
        error: Errors.validation(parsedLocale.error.flatten()),
      };
    }

    const parsedItems = z.array(carouselItemSchema).max(18).safeParse(input);
    if (!parsedItems.success) {
      return {
        success: false,
        data: null,
        error: Errors.validation(parsedItems.error.flatten()),
      };
    }

    const items: Prisma.HomeCarouselItemCreateManyInput[] = parsedItems.data.map((item, index) => ({
      locale: parsedLocale.data,
      title: sanitizeText(item.title),
      description: sanitizeText(item.description).trim() || null,
      href: item.href.trim() || null,
      imageUrl: item.imageUrl.trim(),
      imageAlt: sanitizeText(item.imageAlt).trim() || null,
      sortOrder: index,
      isActive: item.isActive,
    }));

    await prisma.$transaction(async (tx) => {
      await tx.homeCarouselItem.deleteMany({ where: { locale: parsedLocale.data } });
      if (items.length > 0) {
        await tx.homeCarouselItem.createMany({ data: items });
      }
    });

    void writeAuditLog({
      action: "UPDATE",
      entityType: "HomeCarouselItem",
      metadata: { locale: parsedLocale.data, count: items.length },
      userId: admin.userId,
      ...meta,
    });

    revalidateTag("home-carousel");
    revalidatePublicPages();
    return { success: true, data: await getHomeCarouselItems(parsedLocale.data, true), error: null };
  } catch (e: unknown) {
    console.error(`[Site] carousel error [${meta.requestId}]:`, e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        data: null,
        error: Errors.validation({
          formErrors: [`${e.code}: ${e.message}`],
        }),
      };
    }
    if (e instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        data: null,
        error: Errors.validation({ formErrors: [e.message] }),
      };
    }
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}
