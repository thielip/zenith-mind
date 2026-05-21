import { prisma } from "@/infrastructure/db/prisma";
import { DEFAULT_CATEGORIES } from "@/lib/categories/defaults";
import { DEFAULT_SITE_LOGO_PATH } from "@/lib/site/brand";
import { DEFAULT_QUICK_LINKS } from "@/lib/site/default-quick-links";
import { isPrismaMissingColumnError } from "@/lib/site/prisma-compat";
import type {
  QuickLinkItem,
  SiteSettingsData,
  SocialLinks,
  HomepageCopy,
  AboutSectionData,
  TopicClusterCardCopy,
} from "@/lib/site/types";

const DEFAULT_TOPIC_CLUSTER_CARD_BODIES: { zh: string; en: string }[] = [
  { zh: "全球趨勢、地緣政治、科技變局與跨市場觀察。", en: "Global trends, geopolitics, technology shifts and cross-market perspectives." },
  { zh: "投資理財、量化交易、資產配置與市場策略。", en: "Investing, quant trading, asset allocation and market strategy." },
  { zh: "AI 工具、Agent、自動化工作流與新興科技應用。", en: "AI tools, agents, automation workflows and emerging technology use cases." },
  { zh: "學習方法、知識管理、教育科技與個人成長。", en: "Learning systems, knowledge management, edtech and personal growth." },
  { zh: "旅遊、生活風格、效率工具與可持續的個人品牌。", en: "Travel, lifestyle, productivity tools and sustainable personal branding." },
  { zh: "尚未歸類但值得保留的觀點、實驗與專題。", en: "Uncategorized ideas, experiments and special topics worth keeping." },
];

function buildDefaultTopicClusterCards(): TopicClusterCardCopy[] {
  return DEFAULT_CATEGORIES.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    nameEn: c.nameEn,
    description: DEFAULT_TOPIC_CLUSTER_CARD_BODIES[i]?.zh ?? "",
    descriptionEn: DEFAULT_TOPIC_CLUSTER_CARD_BODIES[i]?.en ?? "",
  }));
}

export const DEFAULT_HOMEPAGE_COPY: HomepageCopy = {
  socialProof: {
    eyebrow: "累積中的內容動能",
    eyebrowEn: "Proof of momentum",
    title: "為創作者、投資者與 AI 實作者打造的知識資產庫。",
    titleEn: "A growing knowledge base for builders, investors and creators.",
    lead: "每一篇內容都以搜尋流量、實戰框架與雙語分發為核心，讓知識能長期累積價值。",
    leadEn: "Every article is designed to compound through search, practical frameworks and bilingual distribution.",
    statPostsLabel: "篇內容資產",
    statPostsLabelEn: "published insights",
    statTopicsLabel: "個主題群集",
    statTopicsLabelEn: "topic clusters",
    statViewsLabel: "首頁載入次數（本語系）",
    statViewsLabelEn: "homepage loads (this locale)",
    badges: ["AI 工作流", "SEO 內容系統", "投資理財框架", "個人媒體資產"],
    badgesEn: ["AI workflows", "SEO systems", "Investing frameworks", "Personal media"],
  },
  topicClusters: {
    eyebrow: "主題內容群集",
    eyebrowEn: "Topic Clusters",
    title: "六大主題，建立可累積的 SEO 流量池",
    titleEn: "Six pillars for long-term SEO growth",
    viewAll: "查看所有文章",
    viewAllEn: "View all articles",
    explore: "探索主題",
    exploreEn: "Explore cluster",
    cards: buildDefaultTopicClusterCards(),
  },
  visualCarousel: {
    eyebrow: "精選視覺內容",
    eyebrowEn: "Visual Stories",
    title: "探索精選內容集合",
    titleEn: "Explore featured collections",
    description: "以橫向捲動方式快速瀏覽重點內容，兼顧速度、視覺與 SEO 結構。",
    descriptionEn: "Swipe through curated images and resources designed for fast discovery.",
  },
  featuredPosts: {
    eyebrow: "精選文章",
    eyebrowEn: "Featured Articles",
    title: "先讀這些高槓桿知識主題",
    titleEn: "Start with the highest-leverage ideas",
    browseAll: "瀏覽全部",
    browseAllEn: "Browse all",
    minRead: "分鐘閱讀",
    minReadEn: "min read",
  },
  monetization: {
    eyebrow: "商業定位與變現邏輯",
    eyebrowEn: "Business Model",
    title: "先以免費內容建立信任，再逐步導向可變現資產。",
    titleEn: "Freemium media first, monetization-ready by design.",
    description: "巔峰思維初期不做金流，先專注 SEO 內容與聯盟導流；當讀者信任與主題群集成熟後，再延伸付費專欄、AI 工具、課程與顧問服務。",
    descriptionEn: "Zenith Mind starts with SEO content and affiliate conversion, then expands into external offers, premium columns and AI tools when the audience is ready.",
    items: [
      { title: "免費 SEO 內容", titleEn: "Free SEO content", description: "以長尾關鍵字文章累積自然搜尋流量。", descriptionEn: "Evergreen articles that bring organic search traffic." },
      { title: "聯盟行銷轉換", titleEn: "Affiliate conversion", description: "推薦工具、服務與課程，透過可追蹤連結導流。", descriptionEn: "Tool and service recommendations routed through measurable links." },
      { title: "未來付費專欄", titleEn: "Future paid column", description: "先預留會員制內容方向，不在初期接金流。", descriptionEn: "A reserved path for premium insights without enabling billing yet." },
      { title: "未來 AI 工具", titleEn: "Future AI tools", description: "保留訂閱制工具產品線，支援內容工作流。", descriptionEn: "A subscription-ready product direction for content workflows." },
    ],
  },
  affiliate: {
    eyebrow: "推薦資源",
    eyebrowEn: "Recommended Resources",
    title: "精選聯盟連結",
    titleEn: "Tools and services we recommend",
    description: "這些連結由後台聯盟連結管理，會透過可追蹤短網址導流。",
    descriptionEn: "These links are managed from the admin affiliate dashboard and route through trackable short links.",
  },
  programmaticSeo: {
    eyebrow: "Programmatic SEO 引擎",
    eyebrowEn: "Programmatic SEO Engine",
    title: "為長尾搜尋需求預留內容擴張架構。",
    titleEn: "Built for long-tail search demand.",
    description: "第一版先建立編輯型主題群集；下一階段可擴張城市、問題、比較型頁面，並串接 Canonical、Sitemap 與 Breadcrumb Schema。",
    descriptionEn: "The first version focuses on editorial clusters. Future phases can generate location, question and comparison pages with canonical URLs and sitemaps.",
    buttonLabel: "查看內容庫",
    buttonLabelEn: "See content library",
    strategies: [
      { title: "地域型 SEO", titleEn: "Geo pages", description: "台中 + 投資、東京 + 房地產、台北 + AI課程。", descriptionEn: "Taichung investing, Tokyo real estate, Taipei AI courses." },
      { title: "問題型長尾", titleEn: "Question intent", description: "如何用 AI 賺錢、房地產投資新手。", descriptionEn: "How to make money with AI, real estate investing for beginners." },
      { title: "比較型內容", titleEn: "Comparison intent", description: "ETF vs 房地產、ChatGPT vs Claude。", descriptionEn: "ETF vs real estate, ChatGPT vs Claude." },
    ],
  },
  conversionBanner: {
    eyebrow: "AI 工作流與資源",
    eyebrowEn: "AI workflow & resources",
    title: "用 AI 工具串起內容、研究與 SEO 工作流",
    titleEn: "Chain AI tools into research, writing and SEO workflows",
    description: "從主題發想、長尾關鍵字到草稿與排版，建立可重複的內容生產節奏；搭配聯盟資源驗證變現路徑。",
    descriptionEn:
      "Move from ideas to long-tail keywords to drafts with a repeatable rhythm — pair with recommended resources to validate monetization.",
    ctaLabel: "瀏覽推薦資源",
    ctaLabelEn: "Browse resources",
    ctaHref: "#affiliate-links",
  },
};

export const DEFAULT_ABOUT_SECTIONS: AboutSectionData[] = [
  {
    id: "about-intro",
    title: "關於巔峰思維",
    titleEn: "About Zenith Mind",
    body: "巔峰思維是一個專注於 AI 工具、投資理財、量化交易與個人品牌的知識平台，幫助你建立財富思維，加速實現財務自由。",
    bodyEn: "Zenith Mind is a personal knowledge platform focused on AI tools, investing, quantitative trading, and personal branding.",
    sortOrder: 0,
  },
  {
    id: "about-mission",
    title: "使命",
    titleEn: "Mission",
    body: "分享實用、可執行的知識，讓複雜的財務觀念能夠在日常生活中真正被應用。",
    bodyEn: "To share practical, actionable knowledge that bridges complex financial concepts and everyday application.",
    sortOrder: 1,
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  logoUrl: DEFAULT_SITE_LOGO_PATH,
  logoAlt: "Zenith Mind",
  quickLinks: DEFAULT_QUICK_LINKS,
  socialLinks: {},
  homepageCopy: DEFAULT_HOMEPAGE_COPY,
  aboutSections: DEFAULT_ABOUT_SECTIONS,
  instagramEmbedUrl: "",
  socialSidebarActive: false,
  heroAutoplaySeconds: 8,
  carouselAutoplaySeconds: 6,
};

function asQuickLinks(value: unknown): QuickLinkItem[] {
  if (!Array.isArray(value)) return DEFAULT_QUICK_LINKS;
  const links: QuickLinkItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = typeof record["label"] === "string" ? record["label"] : "";
    const href = typeof record["href"] === "string" ? record["href"] : "";
    if (!label || !href) continue;
    links.push({
      label,
      labelEn: typeof record["labelEn"] === "string" ? record["labelEn"] : "",
      href,
    });
  }
  if (links.length === 0) return DEFAULT_QUICK_LINKS;

  const seen = new Set(links.map((l) => l.href.trim().toLowerCase()));
  const merged = [...links];
  for (const def of DEFAULT_QUICK_LINKS) {
    if (merged.length >= 14) break;
    const key = def.href.trim().toLowerCase();
    if (!seen.has(key)) {
      merged.push(def);
      seen.add(key);
    }
  }
  return merged;
}

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function mergeBadgeRow(raw: unknown, fallback: string[], len = 4): string[] {
  const fb = fallback.slice(0, len);
  if (!Array.isArray(raw)) return fb;
  const out: string[] = [];
  for (let i = 0; i < len; i++) {
    const v = raw[i];
    out.push(typeof v === "string" && v.trim() ? v.trim() : fb[i] ?? "");
  }
  return out;
}

function asTopicClusterCards(value: unknown): TopicClusterCardCopy[] {
  const defaults = buildDefaultTopicClusterCards();
  if (!Array.isArray(value) || value.length === 0) return defaults;
  return defaults.map((def, i) => {
    const bySlug = value.find(
      (x) => !!x && typeof x === "object" && (x as Record<string, unknown>)["slug"] === def.slug
    ) as Record<string, unknown> | undefined;
    const row =
      bySlug ??
      (value[i] && typeof value[i] === "object" ? (value[i] as Record<string, unknown>) : undefined);
    if (!row) return def;
    return {
      slug: def.slug,
      name: asText(row["name"], def.name),
      nameEn: asText(row["nameEn"], def.nameEn),
      description: asText(row["description"], def.description),
      descriptionEn: asText(row["descriptionEn"], def.descriptionEn),
      imageUrl: asText(row["imageUrl"]),
      imageAlt: asText(row["imageAlt"]),
      href: asText(row["href"]),
      imageUrlEn: asText(row["imageUrlEn"]),
      imageAltEn: asText(row["imageAltEn"]),
      hrefEn: asText(row["hrefEn"]),
    };
  });
}

export function asHomepageCopy(value: unknown): HomepageCopy {
  if (!value || typeof value !== "object") return DEFAULT_HOMEPAGE_COPY;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CMS JSON 結構動態
  const record = value as Record<string, any>;
  const sp = record["socialProof"] ?? {};
  const tc = record["topicClusters"] ?? {};
  const vc = record["visualCarousel"] ?? {};
  const fp = record["featuredPosts"] ?? {};
  const mon = record["monetization"] ?? {};
  const aff = record["affiliate"] ?? {};
  const ps = record["programmaticSeo"] ?? {};
  const conv = record["conversionBanner"] ?? {};

  const defaultItems = DEFAULT_HOMEPAGE_COPY.monetization.items;
  const mergedItems = Array.isArray(mon.items) && mon.items.length > 0
    ? (mon.items as Record<string, string>[]).map((it) => ({
        title: "",
        titleEn: "",
        description: "",
        descriptionEn: "",
        ...it,
      }))
    : defaultItems;

  const defaultStrategies = DEFAULT_HOMEPAGE_COPY.programmaticSeo.strategies;
  const mergedStrategies = Array.isArray(ps.strategies) && ps.strategies.length > 0
    ? (ps.strategies as Record<string, string>[]).map((it) => ({
        title: "",
        titleEn: "",
        description: "",
        descriptionEn: "",
        ...it,
      }))
    : defaultStrategies;

  return {
    socialProof: {
      ...DEFAULT_HOMEPAGE_COPY.socialProof,
      ...sp,
      badges: mergeBadgeRow(sp["badges"], DEFAULT_HOMEPAGE_COPY.socialProof.badges),
      badgesEn: mergeBadgeRow(sp["badgesEn"], DEFAULT_HOMEPAGE_COPY.socialProof.badgesEn),
    },
    topicClusters: {
      ...DEFAULT_HOMEPAGE_COPY.topicClusters,
      ...tc,
      cards: asTopicClusterCards(tc["cards"]),
    },
    visualCarousel: { ...DEFAULT_HOMEPAGE_COPY.visualCarousel, ...vc },
    featuredPosts: { ...DEFAULT_HOMEPAGE_COPY.featuredPosts, ...fp },
    monetization: {
      ...DEFAULT_HOMEPAGE_COPY.monetization,
      ...mon,
      items: mergedItems,
    },
    affiliate: { ...DEFAULT_HOMEPAGE_COPY.affiliate, ...aff },
    programmaticSeo: {
      ...DEFAULT_HOMEPAGE_COPY.programmaticSeo,
      ...ps,
      strategies: mergedStrategies,
    },
    conversionBanner: {
      ...DEFAULT_HOMEPAGE_COPY.conversionBanner,
      ...conv,
    },
  };
}

function asAboutSections(value: unknown): AboutSectionData[] {
  if (!Array.isArray(value)) return DEFAULT_ABOUT_SECTIONS;
  const sections: AboutSectionData[] = [];
  value.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const section: AboutSectionData = {
        id: asText(record["id"], `about-${index}`),
        title: asText(record["title"]),
        titleEn: asText(record["titleEn"]),
        body: asText(record["body"]),
        bodyEn: asText(record["bodyEn"]),
        sortOrder: typeof record["sortOrder"] === "number" ? record["sortOrder"] : index,
    };
    if (section.title || section.body) sections.push(section);
  });
  sections.sort((a, b) => a.sortOrder - b.sortOrder);
  return sections.length > 0 ? sections : DEFAULT_ABOUT_SECTIONS;
}

function asSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  return {
    facebookPageUrl:
      typeof record["facebookPageUrl"] === "string" ? record["facebookPageUrl"] : "",
    youtubeChannelUrl:
      typeof record["youtubeChannelUrl"] === "string" ? record["youtubeChannelUrl"] : "",
    instagramUrl:
      typeof record["instagramUrl"] === "string" ? record["instagramUrl"] : "",
    lineUrl:
      typeof record["lineUrl"] === "string" ? record["lineUrl"] : "",
    lineLabel:
      typeof record["lineLabel"] === "string" && record["lineLabel"].trim()
        ? record["lineLabel"]
        : "官方帳號",
  };
}

export type SiteSettingsDbRow = {
  logoUrl: string | null;
  logoAlt: string | null;
  quickLinks: unknown;
  socialLinks: unknown;
  homepageCopy: unknown;
  aboutSections: unknown;
  instagramEmbedUrl: string | null;
  socialSidebarActive: boolean;
  heroAutoplaySeconds?: number | null;
  carouselAutoplaySeconds?: number | null;
};

/** 供 Prisma / Supabase REST 共用（公開站 Edge 映射） */
export function mapSiteSettingsRow(row: SiteSettingsDbRow): SiteSettingsData {
  return {
    logoUrl: row.logoUrl ?? "",
    logoAlt: row.logoAlt ?? DEFAULT_SITE_SETTINGS.logoAlt,
    quickLinks: asQuickLinks(row.quickLinks),
    socialLinks: asSocialLinks(row.socialLinks),
    homepageCopy: asHomepageCopy(row.homepageCopy),
    aboutSections: asAboutSections(row.aboutSections),
    instagramEmbedUrl: row.instagramEmbedUrl ?? "",
    socialSidebarActive: row.socialSidebarActive,
    heroAutoplaySeconds:
      typeof row.heroAutoplaySeconds === "number" && row.heroAutoplaySeconds >= 0
        ? Math.min(120, Math.floor(row.heroAutoplaySeconds))
        : DEFAULT_SITE_SETTINGS.heroAutoplaySeconds,
    carouselAutoplaySeconds:
      typeof row.carouselAutoplaySeconds === "number" &&
      row.carouselAutoplaySeconds >= 0
        ? Math.min(120, Math.floor(row.carouselAutoplaySeconds))
        : DEFAULT_SITE_SETTINGS.carouselAutoplaySeconds,
  };
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
    if (!settings) return DEFAULT_SITE_SETTINGS;

    return mapSiteSettingsRow(settings as SiteSettingsDbRow);
  } catch (e) {
    if (!isPrismaMissingColumnError(e)) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[getSiteSettings] degraded to defaults", e);
      }
      return DEFAULT_SITE_SETTINGS;
    }

    type LegacyRow = {
      id: string;
      logoUrl: string | null;
      logoAlt: string | null;
      quickLinks: unknown;
      socialLinks: unknown;
      homepageCopy: unknown;
      aboutSections: unknown;
      instagramEmbedUrl: string | null;
      socialSidebarActive: boolean;
    };

    const rows = await prisma.$queryRaw<LegacyRow[]>`
      SELECT id, "logoUrl", "logoAlt", "quickLinks", "socialLinks", "homepageCopy",
             "aboutSections", "instagramEmbedUrl", "socialSidebarActive"
      FROM site_settings
      WHERE id = 'site'
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return DEFAULT_SITE_SETTINGS;

    return mapSiteSettingsRow(row);
  }
}

