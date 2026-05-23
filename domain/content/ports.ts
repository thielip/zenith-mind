import type { PublicPostListItemDto } from "@/lib/dto/post-public.dto";

export interface AffiliateLinkRedirect {
  id: string;
  slug: string;
  targetUrl: string;
}

export interface PublicContentRepository {
  searchPublishedPosts(
    query: string,
    locale: "zh-TW" | "en"
  ): Promise<PublicPostListItemDto[]>;

  findActiveAffiliateLinkBySlug(
    slug: string
  ): Promise<AffiliateLinkRedirect | null>;
}
