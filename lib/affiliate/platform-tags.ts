/** 後台聯盟連結平台／分類標籤（下拉與篩選） */
export const AFFILIATE_PLATFORM_TAGS = [
  "AI 工具",
  "線上課程",
  "書籍推薦",
  "旅遊住宿",
  "金融理財",
  "其他",
] as const;

export type AffiliatePlatformTag = (typeof AFFILIATE_PLATFORM_TAGS)[number];
