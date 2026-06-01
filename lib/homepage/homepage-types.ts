import type { HomePostCard } from "@/components/home/FeaturedPostsSection";

export type FeaturedPostItem = HomePostCard;

export type AffiliateLinkItem = {
  name: string;
  slug: string;
  platform: string | null;
  commission: string | null;
};

/** domain/content 契約用別名 */
export type AffiliateLinkHomeItem = AffiliateLinkItem;
