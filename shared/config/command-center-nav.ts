import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Globe2,
  LineChart,
  Radar,
  Search,
  Plug,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export interface CommandNavItem {
  href: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  description: string;
}

export const COMMAND_CENTER_NAV: CommandNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "AI 戰情總覽",
    labelEn: "War Room",
    icon: Sparkles,
    description: "全域 AI 作戰儀表與即時態勢",
  },
  {
    href: "/admin/dashboard/seo",
    label: "SEO 情報",
    labelEn: "SEO",
    icon: Search,
    description: "自然搜尋、關鍵字與索引覆蓋",
  },
  {
    href: "/admin/dashboard/geo",
    label: "GEO 情報",
    labelEn: "GEO",
    icon: Globe2,
    description: "生成式引擎能見度與引用",
  },
  {
    href: "/admin/dashboard/aeo",
    label: "AEO 情報",
    labelEn: "AEO",
    icon: Brain,
    description: "回答引擎與結構化資料",
  },
  {
    href: "/admin/dashboard/agents",
    label: "Agent 中控",
    labelEn: "Agents",
    icon: Bot,
    description: "AI Agent 管線與任務佇列",
  },
  {
    href: "/admin/dashboard/realtime",
    label: "即時監控",
    labelEn: "Realtime",
    icon: Activity,
    description: "即時流量、事件與終端機",
  },
  {
    href: "/admin/dashboard/business",
    label: "商業分析",
    labelEn: "Business",
    icon: BarChart3,
    description: "漏斗、ROI 與廣告成效",
  },
  {
    href: "/admin/dashboard/traffic",
    label: "流量全景",
    labelEn: "Traffic",
    icon: TrendingUp,
    description: "來源、熱門頁與趨勢",
  },
  {
    href: "/admin/dashboard/content",
    label: "內容情報",
    labelEn: "Content",
    icon: LineChart,
    description: "內容權威度與表現",
  },
  {
    href: "/admin/dashboard/errors",
    label: "錯誤追蹤",
    labelEn: "Errors",
    icon: AlertTriangle,
    description: "錯誤率、日誌與異常",
  },
  {
    href: "/admin/dashboard/integrations",
    label: "串接設定",
    labelEn: "Integrations",
    icon: Plug,
    description: "外部帳號與金鑰、一鍵啟動連線",
  },
  {
    href: "/admin/dashboard/security",
    label: "安全中心",
    labelEn: "Security",
    icon: Shield,
    description: "憑證、串接與風險",
  },
  {
    href: "/admin/dashboard/forecast",
    label: "預測中心",
    labelEn: "Forecast",
    icon: Radar,
    description: "AI 趨勢與成本預測",
  },
];

export const CONTENT_ADMIN_NAV = [
  { href: "/admin/posts", label: "文章管理", icon: "FileText" },
  { href: "/admin/media", label: "媒體庫", icon: "Image" },
  { href: "/admin/site", label: "首頁版型", icon: "PanelsTopLeft" },
  { href: "/admin/affiliate", label: "聯盟連結", icon: "Link2" },
  { href: "/admin/audit-log", label: "操作紀錄", icon: "ClipboardList" },
  { href: "/admin/settings", label: "設定", icon: "Settings" },
] as const;
