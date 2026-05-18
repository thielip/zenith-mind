/** 部落格文章詳頁共用型別（無 Prisma 依賴） */

export type BlogPostFaq = {
  question: string;
  questionEn?: string;
  answer: string;
  answerEn?: string;
};

export type BlogPostSeo = {
  metaTitle: string | null;
  metaTitleEn: string | null;
  metaDescription: string | null;
  metaDescriptionEn: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  noIndex: boolean;
  noFollow: boolean;
};

export type BlogPostDetail = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  content: string;
  contentEn: string | null;
  contentType: string;
  contentBlocks: unknown;
  faq: BlogPostFaq[] | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  coverImageWidth: number | null;
  coverImageHeight: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string | null;
  readingTime: number;
  isPasswordProtected: boolean;
  category: {
    id: string;
    name: string;
    nameEn: string | null;
    slug: string;
  } | null;
  tags: { tag: { name: string; slug: string } }[];
  seoMetadata: BlogPostSeo | null;
  _count: { pageViews: number };
};

export type RecommendedPostCard = {
  slug: string;
  title: string;
  titleEn: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  publishedAt: Date | null;
};
