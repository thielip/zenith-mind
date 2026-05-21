import { isNextImageRemoteUrl } from "@/lib/images/next-image-host";

export type MediaSourceType = "logo" | "hero" | "carousel" | "postCover";

export type MediaStorageKind = "supabase" | "external";

export interface MediaLibraryItem {
  title: string;
  url: string;
  source: string;
  sourceType: MediaSourceType;
  entityId?: string;
  storage: MediaStorageKind;
}

export function classifyMediaStorage(url: string): MediaStorageKind {
  return isNextImageRemoteUrl(url) ? "supabase" : "external";
}

export const MEDIA_TYPE_LABELS: Record<MediaSourceType, string> = {
  logo: "LOGO",
  hero: "首頁大圖 (Hero)",
  carousel: "輪播圖 (Carousel)",
  postCover: "文章封面 (Post)",
};

export const MEDIA_FILTER_TABS: Array<{ id: "all" | MediaSourceType; label: string }> =
  [
    { id: "all", label: "全部" },
    { id: "hero", label: "Hero" },
    { id: "carousel", label: "Carousel" },
    { id: "postCover", label: "Post" },
    { id: "logo", label: "LOGO" },
  ];
