import { BlogPostDetailSchema } from "@/domain/content/public-read.schemas";
import {
  mapBlogPostDetailFromCore,
  mapAuthorFromUserRecord,
} from "@/lib/blog/map-blog-post-detail";
import { mapBlogPostAuthor } from "@/lib/blog/map-blog-post-author";

const seoRow = {
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

describe("mapBlogPostDetailFromCore (Prisma / Supabase parity)", () => {
  const baseCore = {
    id: "post-1",
    slug: "hello-world",
    title: "你好",
    titleEn: "Hello",
    excerpt: "摘要",
    excerptEn: "Summary",
    content: "<p>body</p>",
    contentEn: null,
    contentType: "html",
    contentBlocks: null,
    faq: [{ question: "Q?", answer: "A." }],
    coverImage: null,
    coverImageAlt: null,
    coverImageWidth: null,
    coverImageHeight: null,
    publishedAt: new Date("2026-01-15T08:00:00.000Z"),
    createdAt: new Date("2026-01-10T00:00:00.000Z"),
    updatedAt: new Date("2026-01-16T00:00:00.000Z"),
    categoryId: "cat-1",
    readingTime: 5,
    isPasswordProtected: false,
    category: { id: "cat-1", name: "科技", nameEn: "Tech", slug: "tech" },
    tags: [{ tag: { name: "AI", slug: "ai" } }],
    seoMetadata: seoRow,
    pageViews: 42,
  };

  it("maps Prisma-shaped author include to Zod-valid detail", () => {
    const author = mapAuthorFromUserRecord({
      id: "user-1",
      email: "writer@getzenithmind.com",
    });
    const detail = mapBlogPostDetailFromCore({ ...baseCore, author });
    const parsed = BlogPostDetailSchema.safeParse(detail);
    expect(parsed.success).toBe(true);
    expect(detail.author?.displayName).toBe("writer");
    expect(detail._count.pageViews).toBe(42);
  });

  it("maps Supabase-shaped author fetch to the same Zod contract", () => {
    const author = mapBlogPostAuthor("user-2", "editor.name@example.com");
    const detail = mapBlogPostDetailFromCore({ ...baseCore, author });
    const parsed = BlogPostDetailSchema.safeParse(detail);
    expect(parsed.success).toBe(true);
    expect(detail.author?.displayName).toBe("editor name");
  });

  it("allows null author when backend has no user row", () => {
    const detail = mapBlogPostDetailFromCore({ ...baseCore, author: null });
    expect(BlogPostDetailSchema.safeParse(detail).success).toBe(true);
    expect(detail.author).toBeNull();
  });
});
