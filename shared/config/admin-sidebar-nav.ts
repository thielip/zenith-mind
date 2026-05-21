import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  ClipboardList,
  FileText,
  Image,
  Link2,
  PanelsTopLeft,
  Radar,
  Search,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

export interface AdminNavLink {
  type: "link";
  href: string;
  label: string;
  icon: LucideIcon;
  /** 僅路徑完全一致時才算 active（用於 /admin/dashboard 總覽） */
  exact?: boolean;
}

export interface AdminNavSubmenu {
  type: "submenu";
  id: string;
  label: string;
  icon: LucideIcon;
  children: { href: string; label: string }[];
}

export type AdminNavItem = AdminNavLink | AdminNavSubmenu;

export interface AdminNavGroup {
  id: string;
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_SIDEBAR_NAV: AdminNavGroup[] = [
  {
    id: "ai-intel",
    title: "AI 戰情與情報",
    items: [
      {
        type: "link",
        href: "/admin/dashboard",
        label: "AI 戰情總覽",
        icon: Sparkles,
        exact: true,
      },
      {
        type: "submenu",
        id: "search-intel",
        label: "搜尋生成情報",
        icon: Search,
        children: [
          { href: "/admin/dashboard/seo", label: "SEO 情報" },
          { href: "/admin/dashboard/geo", label: "GEO 情報" },
          { href: "/admin/dashboard/aeo", label: "AEO 情報" },
        ],
      },
      {
        type: "submenu",
        id: "traffic-intel",
        label: "數據流量分析",
        icon: BarChart3,
        children: [
          { href: "/admin/dashboard/traffic", label: "流量全景" },
          { href: "/admin/dashboard/business", label: "商業分析" },
          { href: "/admin/dashboard/content", label: "內容情報" },
        ],
      },
      {
        type: "link",
        href: "/admin/dashboard/realtime",
        label: "即時監控",
        icon: Activity,
      },
    ],
  },
  {
    id: "ai-auto",
    title: "AI 自動化",
    items: [
      {
        type: "link",
        href: "/admin/dashboard/agents",
        label: "Agent 中控",
        icon: Bot,
      },
      {
        type: "link",
        href: "/admin/dashboard/forecast",
        label: "預測中心",
        icon: Radar,
      },
    ],
  },
  {
    id: "content",
    title: "內容管理",
    items: [
      { type: "link", href: "/admin/site", label: "首頁版型", icon: PanelsTopLeft },
      { type: "link", href: "/admin/posts", label: "文章管理", icon: FileText },
      { type: "link", href: "/admin/media", label: "媒體庫", icon: Image },
      { type: "link", href: "/admin/affiliate", label: "聯盟連結", icon: Link2 },
    ],
  },
  {
    id: "ops",
    title: "系統運維與設定",
    items: [
      {
        type: "submenu",
        id: "security-hub",
        label: "安全中控",
        icon: Shield,
        children: [
          { href: "/admin/dashboard/security", label: "安全中心" },
          { href: "/admin/dashboard/errors", label: "錯誤追蹤" },
        ],
      },
      {
        type: "link",
        href: "/admin/audit-log",
        label: "操作紀錄",
        icon: ClipboardList,
      },
      {
        type: "link",
        href: "/admin/users",
        label: "使用者管理",
        icon: Users,
      },
      {
        type: "submenu",
        id: "system-settings",
        label: "系統設定",
        icon: Settings,
        children: [
          { href: "/admin/dashboard/integrations", label: "串接設定" },
          { href: "/admin/settings", label: "全站設定" },
        ],
      },
    ],
  },
];
