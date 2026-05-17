// app/(public)/[locale]/page.tsx — 首頁
// Cache 模式 A：revalidate=3600（Segment Config）
// ✓ generateMetadata + Organization JSON-LD
// ✓ 禁止 'use client'、禁止 Prisma 直接操作

import type { Metadata } from "next";
import { env } from "@/env";
import HeroSection from "@/components/home/HeroSection";
import HeroSlider from "@/components/home/HeroSlider";
import ImageCarousel from "@/components/home/ImageCarousel";
import SocialProofSection from "@/components/home/SocialProofSection";
import TopicClusterSection from "@/components/home/TopicClusterSection";
import FeaturedPostsSection from "@/components/home/FeaturedPostsSection";
import MonetizationSection from "@/components/home/MonetizationSection";
import AffiliateLinksSection from "@/components/home/AffiliateLinksSection";
import ProgrammaticSeoSection from "@/components/home/ProgrammaticSeoSection";
import HomeConversionBanner from "@/components/home/HomeConversionBanner";
import AdSlotBanner from "@/components/home/AdSlotBanner";
import HomePageViewTracker from "@/components/analytics/HomePageViewTracker";
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

  const topics = siteSettings.homepageCopy.topicClusters.cards.map((c) => ({
    slug: c.slug,
    name: c.name,
    nameEn: c.nameEn,
    description: c.description,
    descriptionEn: c.descriptionEn,
  }));

  return (
    <>
      <HomePageViewTracker locale={locale} />

      {heroSlides.length > 0 ? (
        <HeroSlider
          locale={locale}
          slides={heroSlides}
          autoplaySeconds={siteSettings.heroAutoplaySeconds}
        />
      ) : (
        <HeroSection locale={locale} />
      )}
      <AdSlotBanner slotKey="home_below_hero" locale={siteLocale} />
      <SocialProofSection
        locale={locale}
        publishedPosts={publishedPostCount}
        categoryCount={categoryCount}
        homePageViews={homePageViews}
        copy={siteSettings.homepageCopy.socialProof}
      />
      <TopicClusterSection
        locale={locale}
        topics={topics}
        copy={siteSettings.homepageCopy.topicClusters}
      />
      <ImageCarousel
        locale={locale}
        items={carouselItems}
        autoplaySeconds={siteSettings.carouselAutoplaySeconds}
        copy={siteSettings.homepageCopy.visualCarousel}
      />
      <FeaturedPostsSection locale={locale} posts={featuredPosts} copy={siteSettings.homepageCopy.featuredPosts} />
      <HomeConversionBanner locale={locale} copy={siteSettings.homepageCopy.conversionBanner} />
      <MonetizationSection locale={locale} copy={siteSettings.homepageCopy.monetization} />
      <AffiliateLinksSection locale={locale} links={affiliateLinks} copy={siteSettings.homepageCopy.affiliate} />
      <ProgrammaticSeoSection locale={locale} copy={siteSettings.homepageCopy.programmaticSeo} />

    </>
  );
}
