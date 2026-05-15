import type { Post, Category } from "@prisma/client";
import { toLocalizedStringDto, type LocalizedStringDto } from "@/lib/i18n/api-locale-contract";

/** 前台列表／搜尋 API 穩定輸出（勿直接把 Prisma 物件傳給公開端） */
export interface PublicPostListItemDto {
  id: string;
  slug: string;
  title: LocalizedStringDto;
  excerpt: LocalizedStringDto;
  publishedAt: string | null;
  readingTime: number;
  category: { slug: string; name: LocalizedStringDto } | null;
}

type PostListRow = Pick<
  Post,
  "id" | "slug" | "title" | "titleEn" | "excerpt" | "excerptEn" | "publishedAt" | "readingTime"
> & {
  category: Pick<Category, "slug" | "name" | "nameEn"> | null;
};

export function toPublicPostListItemDto(
  row: PostListRow,
  locale: "zh-TW" | "en"
): PublicPostListItemDto {
  return {
    id: row.id,
    slug: row.slug,
    title: toLocalizedStringDto(row.title, row.titleEn, locale),
    excerpt: toLocalizedStringDto(row.excerpt ?? "", row.excerptEn, locale),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    readingTime: row.readingTime,
    category: row.category
      ? {
          slug: row.category.slug,
          name: toLocalizedStringDto(row.category.name, row.category.nameEn, locale),
        }
      : null,
  };
}
