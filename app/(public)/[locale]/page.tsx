// app/(public)/[locale]/page.tsx — 首頁
// Cache 模式 A：revalidate=3600（Segment Config）
// ✓ generateMetadata + Organization JSON-LD
// ✓ 禁止 'use client'、禁止 Prisma 直接操作

import type { Metadata } from "next";
import { headers } from "next/headers";
import { env } from "@/env";
import JsonLd from "@/components/seo/JsonLd";
import { buildHomeWebPageSchema } from "@/lib/seo/schemas/article.schema";
import HeroSection from "@/components/home/HeroSection";
import HeroSlider from "@/components/home/HeroSlider";
import { heroLcpPreload } from "@/components/home/HeroLcpPreload";
import SocialProofSection from "@/components/home/SocialProofSection";
import DeferredHomePageViewTracker from "@/components/analytics/DeferredHomePageViewTracker";
import {
  DeferredAdSlotBanner,
  DeferredAffiliateLinksSection,
  DeferredFeaturedPostsSection,
  DeferredHomeConversionBanner,
  DeferredImageCarousel,
  DeferredMonetizationSection,
  DeferredProgrammaticSeoSection,
  DeferredTopicClusterSection,
} from "@/components/home/home-deferred-sections";
import { loadHomepageData } from "@/lib/homepage/load-homepage-data";
import type { SiteLocale } from "@/lib/site/types";

// ── Cache 模式 A（Segment Config）────────────────────────
// ⚠ 此頁面中所有 fetch() 禁止再設定 revalidate（衝突）
export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const canonical = `${siteUrl}/${isEn ? "en" : "zh-TW"}`;

  return {
    title: isEn
      ? "Zenith Mind — AI, Investing, SEO Content and Personal Brand Growth"
      : "巔峰思維 — AI 工具、投資理財、SEO內容與個人品牌變現",
    description: isEn
      ? "A bilingual content media platform for AI tools, quantitative thinking, real estate investing, knowledge monetization and SEO-led personal brand growth."
      : "巔峰思維是內容型媒體與個人品牌平台，聚焦 AI 工具、量化交易、房地產、知識變現與 SEO 導向流量變現。",
    alternates: {
      canonical,
      languages: { "zh-TW": `${siteUrl}/zh-TW`, en: `${siteUrl}/en` },
    },
    openGraph: {
      url:   canonical,
      locale: isEn ? "en_US" : "zh_TW",
      alternateLocale: isEn ? ["zh_TW"] : ["en_US"],
      siteName: "Zenith Mind",
      images: [{ url: `${siteUrl}/og-home.png`, width: 1200, height: 630 }],
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const isEn = locale === "en";

  const siteLocale = (isEn ? "en" : "zh-TW") satisfies SiteLocale;
  const {
    featuredPosts,
    heroSlides,
    carouselItems,
    publishedPostCount,
    categoryCount,
    affiliateLinks,
    siteSettings,
    homePageViews,
  } = await loadHomepageData(siteLocale);

  const firstHeroSlide = heroSlides.find((s) => s.isActive && s.imageUrl);
  if (firstHeroSlide?.imageUrl) {
    heroLcpPreload(firstHeroSlide.imageUrl, firstHeroSlide.title);
  }

  const h = await headers();
  const nonce = h.get("x-nonce") ?? "";
  const homeWebPageSchema = buildHomeWebPageSchema({
    locale: siteLocale,
    title: isEn
      ? "Zenith Mind — AI, Investing, SEO Content and Personal Brand Growth"
      : "巔峰思維 — AI 工具、投資理財、SEO內容與個人品牌變現",
    description: isEn
      ? "A bilingual content media platform for AI tools, quantitative thinking, real estate investing, knowledge monetization and SEO-led personal brand growth."
      : "巔峰思維是內容型媒體與個人品牌平台，聚焦 AI 工具、量化交易、房地產、知識變現與 SEO 導向流量變現。",
  });

  const topics = siteSettings.homepageCopy.topicClusters.cards.map((c) => ({
    slug: c.slug,
    name: c.name,
    nameEn: c.nameEn,
    description: c.description,
    descriptionEn: c.descriptionEn,
    imageUrl: c.imageUrl,
    imageAlt: c.imageAlt,
    href: c.href,
    imageUrlEn: c.imageUrlEn,
    imageAltEn: c.imageAltEn,
    hrefEn: c.hrefEn,
  }));

  return (
    <>
      <JsonLd data={homeWebPageSchema} nonce={nonce} />
      <DeferredHomePageViewTracker locale={locale} />

      {heroSlides.length > 0 ? (
        <HeroSlider
          locale={locale}
          slides={heroSlides}
          autoplaySeconds={siteSettings.heroAutoplaySeconds}
        />
      ) : (
        <HeroSection locale={locale} />
      )}
      <DeferredAdSlotBanner slotKey="home_below_hero" locale={siteLocale} />
      <SocialProofSection
        locale={locale}
        publishedPosts={publishedPostCount}
        categoryCount={categoryCount}
        homePageViews={homePageViews}
        copy={siteSettings.homepageCopy.socialProof}
      />
      <DeferredTopicClusterSection
        locale={locale}
        topics={topics}
        copy={siteSettings.homepageCopy.topicClusters}
      />
      <DeferredImageCarousel
        locale={locale}
        items={carouselItems}
        autoplaySeconds={siteSettings.carouselAutoplaySeconds}
        copy={siteSettings.homepageCopy.visualCarousel}
      />
      <DeferredFeaturedPostsSection
        locale={locale}
        posts={featuredPosts}
        copy={siteSettings.homepageCopy.featuredPosts}
      />
      <DeferredHomeConversionBanner
        locale={locale}
        copy={siteSettings.homepageCopy.conversionBanner}
      />
      <DeferredMonetizationSection
        locale={locale}
        copy={siteSettings.homepageCopy.monetization}
      />
      <DeferredAffiliateLinksSection
        locale={locale}
        links={affiliateLinks}
        copy={siteSettings.homepageCopy.affiliate}
      />
      <DeferredProgrammaticSeoSection
        locale={locale}
        copy={siteSettings.homepageCopy.programmaticSeo}
      />

    </>
  );
}
