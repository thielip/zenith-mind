/** 部落格列表頁共用型別（無 Prisma 依賴） */

export type BlogListTag = {
  slug: string;
  name: string;
  nameEn: string | null;
};

export type BlogListPost = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: Date | null;
  readingTime: number;
  category: {
    name: string;
    nameEn: string | null;
    slug: string;
  } | null;
  tags: { tag: BlogListTag }[];
  _count: { pageViews: number };
};

export type BlogListCategory = {
  slug: string;
  name: string;
  nameEn: string | null;
};

export type BlogListFilters = {
  category?: string;
  tag?: string;
  query?: string;
};

export type BlogListData = {
  posts: BlogListPost[];
  total: number;
  categories: BlogListCategory[];
  tags: BlogListTag[];
};
