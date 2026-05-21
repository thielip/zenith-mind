import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const quickLinks = [
  { label: "內容動能", labelEn: "Momentum", href: "#social-proof" },
  { label: "主題內容", labelEn: "Topics", href: "#topics" },
  { label: "精選視覺", labelEn: "Visual stories", href: "#visual-stories" },
  { label: "精選文章", labelEn: "Featured", href: "#featured" },
  { label: "AI 工作流", labelEn: "AI workflow", href: "#conversion-banner" },
  { label: "商業定位", labelEn: "Monetization", href: "#monetization" },
  { label: "推薦資源", labelEn: "Resources", href: "#affiliate-links" },
  { label: "SEO資源", labelEn: "SEO resources", href: "#programmatic-seo" },
];

const socialLinks = {
  facebookPageUrl: "https://www.facebook.com/facebook",
  youtubeChannelUrl: "https://www.youtube.com/@YouTube",
  instagramUrl: "https://www.instagram.com/instagram/",
};

const heroSlides = [
  {
    locale: "zh-TW",
    title: "用 AI 與 SEO 打造長期流量資產",
    subtitle: "巔峰思維整合 AI 工具、投資理財與個人品牌內容，協助你把知識變成可累積的媒體資產。",
    buttonLabel: "探索文章",
    buttonHref: "/zh-TW/blog",
    imageUrl: "/cms/hero-ai.svg",
    imageAlt: "AI 與內容策略視覺圖",
    textX: 8,
    textY: 50,
    sortOrder: 0,
    isActive: true,
  },
  {
    locale: "zh-TW",
    title: "投資、內容與自動化的高效系統",
    subtitle: "從量化思維到房地產、從 SEO 到聯盟行銷，建立能長期複利的個人知識平台。",
    buttonLabel: "探索文章",
    buttonHref: "/zh-TW/blog",
    imageUrl: "/cms/hero-investing.svg",
    imageAlt: "投資與數據分析視覺圖",
    textX: 10,
    textY: 48,
    sortOrder: 1,
    isActive: true,
  },
  {
    locale: "en",
    title: "Build compounding traffic with AI and SEO",
    subtitle: "Zenith Mind connects AI workflows, investing frameworks and personal brand growth into a modern media system.",
    buttonLabel: "Explore articles",
    buttonHref: "/en/blog",
    imageUrl: "/cms/hero-ai.svg",
    imageAlt: "AI content strategy visual",
    textX: 8,
    textY: 50,
    sortOrder: 0,
    isActive: true,
  },
  {
    locale: "en",
    title: "A sharper system for investing and content",
    subtitle: "Turn ideas, analysis and automated workflows into durable audience and business assets.",
    buttonLabel: "Explore articles",
    buttonHref: "/en/blog",
    imageUrl: "/cms/hero-investing.svg",
    imageAlt: "Investing analytics visual",
    textX: 10,
    textY: 48,
    sortOrder: 1,
    isActive: true,
  },
];

const carouselItems = [
  {
    locale: "zh-TW",
    title: "AI 工具工作流",
    description: "把 AI Agent、n8n 與內容產線串成可複製流程。",
    href: "/zh-TW/blog?category=ai-tech",
    imageUrl: "/cms/carousel-growth.svg",
    imageAlt: "AI 工作流卡片",
    sortOrder: 0,
    isActive: true,
  },
  {
    locale: "zh-TW",
    title: "SEO 與 GEO 內容",
    description: "以搜尋與生成式搜尋為核心，規劃長尾流量資產。",
    href: "/zh-TW/blog",
    imageUrl: "/cms/hero-ai.svg",
    imageAlt: "SEO 內容卡片",
    sortOrder: 1,
    isActive: true,
  },
  {
    locale: "zh-TW",
    title: "投資理財框架",
    description: "從資產配置、量化思維到房地產投報率。",
    href: "/zh-TW/blog?category=quant",
    imageUrl: "/cms/hero-investing.svg",
    imageAlt: "投資理財卡片",
    sortOrder: 2,
    isActive: true,
  },
  {
    locale: "en",
    title: "AI workflows",
    description: "Connect agents, automation and content systems into repeatable workflows.",
    href: "/en/blog?category=ai-tech",
    imageUrl: "/cms/carousel-growth.svg",
    imageAlt: "AI workflow card",
    sortOrder: 0,
    isActive: true,
  },
  {
    locale: "en",
    title: "SEO and GEO content",
    description: "Plan durable long-tail assets for search and generative search.",
    href: "/en/blog",
    imageUrl: "/cms/hero-ai.svg",
    imageAlt: "SEO content card",
    sortOrder: 1,
    isActive: true,
  },
  {
    locale: "en",
    title: "Investing frameworks",
    description: "From allocation and quant thinking to real estate yield.",
    href: "/en/blog?category=quant",
    imageUrl: "/cms/hero-investing.svg",
    imageAlt: "Investing framework card",
    sortOrder: 2,
    isActive: true,
  },
];

try {
  await prisma.siteSettings.upsert({
    where: { id: "site" },
    create: {
      id: "site",
      logoAlt: "Zenith Mind",
      quickLinks,
      socialLinks,
      socialSidebarActive: true,
    },
    update: {
      quickLinks,
      socialLinks,
      socialSidebarActive: true,
    },
  });

  for (const locale of ["zh-TW", "en"]) {
    await prisma.heroSlide.deleteMany({ where: { locale } });
    await prisma.heroSlide.createMany({
      data: heroSlides.filter((slide) => slide.locale === locale),
    });

    await prisma.homeCarouselItem.deleteMany({ where: { locale } });
    await prisma.homeCarouselItem.createMany({
      data: carouselItems.filter((item) => item.locale === locale),
    });
  }

  console.log("Seeded CMS defaults.");
} finally {
  await prisma.$disconnect();
}
