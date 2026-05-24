import type { QuickLinkItem } from "@/lib/site/types";

/** 首頁錨點快速導覽預設（順序與文案與 Footer 一致） */
export const DEFAULT_QUICK_LINKS: QuickLinkItem[] = [
  { label: "內容動能", labelEn: "Momentum", href: "#social-proof" },
  { label: "主題內容", labelEn: "Topics", href: "#topics" },
  { label: "精選視覺", labelEn: "Visual stories", href: "#visual-stories" },
  { label: "精選文章", labelEn: "Featured", href: "#featured" },
  { label: "AI 工作流", labelEn: "AI workflow", href: "#conversion-banner" },
  { label: "商業定位", labelEn: "Monetization", href: "#monetization" },
  { label: "推薦資源", labelEn: "Resources", href: "#affiliate-links" },
  { label: "SEO 引擎", labelEn: "SEO engine", href: "#programmatic-seo" },
];
