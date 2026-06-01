import type {
  AffiliateLinkRedirect,
  PublicContentRepository,
} from "@/domain/content/ports";
import { supabasePublishedVisibilityAndWith } from "@/lib/blog/public-post-visibility";
import { PUBLIC_READ_CACHE_TAGS } from "@/lib/public-content/cache-tags";
import { supabaseRestWithFallback } from "@/lib/db/supabase-rest";
import { toPublicPostListItemDto } from "@/lib/dto/post-public.dto";

const SEARCH_CACHE = {
  kind: "public" as const,
  revalidate: 3600,
  tags: [...PUBLIC_READ_CACHE_TAGS.posts],
};

type SearchPostRow = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  publishedAt: string | null;
  readingTime: number | null;
  categories:
    | { slug: string; name: string; nameEn: string | null }
    | { slug: string; name: string; nameEn: string | null }[]
    | null;
};

type AffiliateRow = {
  id: string;
  slug: string;
  targetUrl: string;
};

function escapeIlikePattern(q: string): string {
  return q.replace(/[%_*\\]/g, "\\$&");
}

function mapCategory(categories: SearchPostRow["categories"]) {
  if (!categories) return null;
  return Array.isArray(categories) ? categories[0] ?? null : categories;
}

export const publicContentSupabaseRepository: PublicContentRepository = {
  async searchPublishedPosts(query, locale) {
    const pattern = `*${escapeIlikePattern(query)}*`;
    const orFilter = [
      `title.ilike.${pattern}`,
      `titleEn.ilike.${pattern}`,
      `excerpt.ilike.${pattern}`,
      `excerptEn.ilike.${pattern}`,
    ].join(",");

    const rows = await supabaseRestWithFallback<SearchPostRow[]>(
      "posts",
      {
        select:
          "id,slug,title,titleEn,excerpt,excerptEn,publishedAt,readingTime,categories(slug,name,nameEn)",
        and: supabasePublishedVisibilityAndWith([`or(${orFilter})`]),
        order: "publishedAt.desc",
        limit: "30",
      },
      [],
      undefined,
      SEARCH_CACHE
    );

    return rows.map((row) => {
      const cat = mapCategory(row.categories);
      return toPublicPostListItemDto(
        {
          id: row.id,
          slug: row.slug,
          title: row.title,
          titleEn: row.titleEn,
          excerpt: row.excerpt,
          excerptEn: row.excerptEn,
          publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
          readingTime: row.readingTime ?? 0,
          category: cat
            ? {
                slug: cat.slug,
                name: cat.name,
                nameEn: cat.nameEn,
              }
            : null,
        },
        locale
      );
    });
  },

  async findActiveAffiliateLinkBySlug(slug) {
    const rows = await supabaseRestWithFallback<AffiliateRow[]>(
      "affiliate_links",
      {
        select: "id,slug,targetUrl",
        slug: `eq.${slug}`,
        isActive: "eq.true",
        limit: "1",
      },
      [],
      undefined,
      { kind: "fresh" }
    );
    const row = rows[0];
    if (!row) return null;
    return { id: row.id, slug: row.slug, targetUrl: row.targetUrl };
  },
};
