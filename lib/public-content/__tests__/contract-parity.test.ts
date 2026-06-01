import {
  BlogListPostSchema,
  BlogPostDetailSchema,
  PublicPostListItemDtoSchema,
} from "@/domain/content/public-read.schemas";
import { toPublicPostListItemDto } from "@/lib/dto/post-public.dto";

const seoFixture = {
  metaTitle: "T",
  metaTitleEn: null,
  metaDescription: "D",
  metaDescriptionEn: null,
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  noIndex: false,
  noFollow: false,
};

describe("public read contract (Zod)", () => {
  const prismaRow = {
    id: "post-1",
    slug: "hello-world",
    title: "你好",
    titleEn: "Hello",
    excerpt: "摘要",
    excerptEn: "Summary",
    publishedAt: new Date("2026-01-15T08:00:00.000Z"),
    readingTime: 5,
    category: { slug: "tech", name: "科技", nameEn: "Tech" },
  };

  it("accepts Prisma-shaped list DTO after mapping (zh-TW)", () => {
    const dto = toPublicPostListItemDto(prismaRow, "zh-TW");
    expect(PublicPostListItemDtoSchema.safeParse(dto).success).toBe(true);
    expect(dto.title.current).toBe("你好");
  });

  it("accepts Supabase-shaped list DTO after mapping (en)", () => {
    const dto = toPublicPostListItemDto(
      { ...prismaRow, publishedAt: new Date("2026-01-15T08:00:00.000Z") },
      "en"
    );
    expect(PublicPostListItemDtoSchema.safeParse(dto).success).toBe(true);
    expect(dto.title.current).toBe("Hello");
  });

  it("validates blog list post with category and tags", () => {
    const listPost = {
      id: "p1",
      slug: "s",
      title: "t",
      titleEn: null,
      excerpt: null,
      excerptEn: null,
      coverImage: null,
      coverImageAlt: null,
      publishedAt: new Date(),
      readingTime: 1,
      category: { name: "C", nameEn: null, slug: "c" },
      tags: [{ tag: { slug: "a", name: "A", nameEn: null } }],
      _count: { pageViews: 0 },
    };
    expect(BlogListPostSchema.safeParse(listPost).success).toBe(true);
  });

  it("validates blog detail with seo and nested relations", () => {
    const detail = {
      id: "p1",
      slug: "s",
      title: "t",
      titleEn: null,
      excerpt: null,
      excerptEn: null,
      content: "<p>x</p>",
      contentEn: null,
      contentType: "html",
      contentBlocks: null,
      faq: null,
      coverImage: null,
      coverImageAlt: null,
      coverImageWidth: null,
      coverImageHeight: null,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryId: "c1",
      readingTime: 1,
      isPasswordProtected: false,
      author: { id: "u1", displayName: "Writer" },
      category: { id: "c1", name: "C", nameEn: null, slug: "c" },
      tags: [{ tag: { name: "A", slug: "a" } }],
      seoMetadata: seoFixture,
      _count: { pageViews: 3 },
    };
    expect(BlogPostDetailSchema.safeParse(detail).success).toBe(true);
  });
});
