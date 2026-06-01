import { PUBLIC_READ_CACHE_TAGS } from "@/lib/public-content/cache-tags";

describe("public read cache tags", () => {
  it("posts tag set matches outbox revalidateTag posts", () => {
    expect(PUBLIC_READ_CACHE_TAGS.posts).toContain("posts");
    expect(PUBLIC_READ_CACHE_TAGS.posts).toContain("blog");
  });

  it("sitemap tags include posts for shared invalidation", () => {
    expect(PUBLIC_READ_CACHE_TAGS.sitemap).toContain("posts");
    expect(PUBLIC_READ_CACHE_TAGS.sitemap).toContain("sitemap");
  });
});
