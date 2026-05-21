export type SiteLocale = "zh-TW" | "en";

export interface QuickLinkItem {
  label: string;
  labelEn?: string;
  href: string;
}

export interface SocialLinks {
  facebookPageUrl?: string;
  youtubeChannelUrl?: string;
  instagramUrl?: string;
  lineUrl?: string;
  lineLabel?: string;
}

export interface LocalizedTextBlock {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
}

/** 首頁「主題群集」卡片（六大 slug 固定，後台可改顯示名、描述、外部圖與連結） */
export interface TopicClusterCardCopy {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  /** 繁中：外部圖片網址（16:9）；空則前台 fallback icon */
  imageUrl?: string;
  imageAlt?: string;
  /** 繁中：點擊導向（https 或站內路徑）；空則導向該主題文章列表 */
  href?: string;
  /** 英文：外部圖片網址（16:9）；空則 fallback 繁中圖或 icon */
  imageUrlEn?: string;
  imageAltEn?: string;
  hrefEn?: string;
}

export interface HomepageCopy {
  /** 數據帶／社會證明區 */
  socialProof: {
    eyebrow: string;
    eyebrowEn: string;
    title: string;
    titleEn: string;
    lead: string;
    leadEn: string;
    statPostsLabel: string;
    statPostsLabelEn: string;
    statTopicsLabel: string;
    statTopicsLabelEn: string;
    statViewsLabel: string;
    statViewsLabelEn: string;
    badges: string[];
    badgesEn: string[];
  };
  /** 主題內容群集區（標題與六大主題卡片文案） */
  topicClusters: {
    eyebrow: string;
    eyebrowEn: string;
    title: string;
    titleEn: string;
    viewAll: string;
    viewAllEn: string;
    explore: string;
    exploreEn: string;
    cards: TopicClusterCardCopy[];
  };
  /** 小圖橫向輪播區塊標題（非輪播項目本身） */
  visualCarousel: {
    eyebrow: string;
    eyebrowEn: string;
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
  };
  /** 精選文章區標題與閱讀時間後綴 */
  featuredPosts: {
    eyebrow: string;
    eyebrowEn: string;
    title: string;
    titleEn: string;
    browseAll: string;
    browseAllEn: string;
    minRead: string;
    minReadEn: string;
  };
  monetization: {
    eyebrow: string;
    eyebrowEn: string;
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    items: LocalizedTextBlock[];
  };
  affiliate: {
    eyebrow: string;
    eyebrowEn: string;
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
  };
  programmaticSeo: {
    eyebrow: string;
    eyebrowEn: string;
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    buttonLabel: string;
    buttonLabelEn: string;
    strategies: LocalizedTextBlock[];
  };
  /** Full-width CTA strip between featured posts and lower homepage sections */
  conversionBanner: {
    eyebrow: string;
    eyebrowEn: string;
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    ctaLabel: string;
    ctaLabelEn: string;
    /** Use `#anchor` for same-site sections, e.g. `#affiliate-links` */
    ctaHref: string;
  };
}

export interface AboutSectionData {
  id: string;
  title: string;
  titleEn?: string;
  body: string;
  bodyEn?: string;
  sortOrder: number;
}

export interface SiteSettingsData {
  logoUrl: string;
  logoAlt: string;
  quickLinks: QuickLinkItem[];
  socialLinks: SocialLinks;
  homepageCopy: HomepageCopy;
  aboutSections: AboutSectionData[];
  instagramEmbedUrl: string;
  socialSidebarActive: boolean;
  /** 首頁大圖輪播自動切換間隔（秒），0=關閉 */
  heroAutoplaySeconds: number;
  /** 首頁小圖橫向輪播自動捲動間隔（秒），0=關閉 */
  carouselAutoplaySeconds: number;
}

export interface HeroSlideData {
  id: string;
  locale: SiteLocale;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  /** 點擊大圖開啟的連結（https 或 / 站內路徑），空白表示不導連 */
  imageHref: string;
  imageUrl: string;
  imageAlt: string;
  textX: number;
  textY: number;
  sortOrder: number;
  isActive: boolean;
}

export interface HomeCarouselItemData {
  id: string;
  locale: SiteLocale;
  title: string;
  description: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
}
