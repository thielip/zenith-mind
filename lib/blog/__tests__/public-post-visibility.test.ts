import {
  prismaPublishedPostWhere,
  supabasePublishedVisibilityAnd,
  supabasePublishedVisibilityAndWith,
} from "@/lib/blog/public-post-visibility";

describe("public-post-visibility", () => {
  const fixed = new Date("2026-06-01T12:00:00.000Z");

  it("prisma filter excludes future publishedAt", () => {
    const where = prismaPublishedPostWhere(fixed);
    expect(where).toMatchObject({
      status: "PUBLISHED",
      deletedAt: null,
    });
    expect(where.OR).toEqual([
      { publishedAt: null },
      { publishedAt: { lte: fixed } },
    ]);
  });

  it("supabase and filter includes status and publishedAt or", () => {
    const and = supabasePublishedVisibilityAnd(fixed);
    expect(and).toContain("status.eq.PUBLISHED");
    expect(and).toContain("deletedAt.is.null");
    expect(and).toContain("publishedAt.lte.2026-06-01T12:00:00.000Z");
    expect(and).toContain("publishedAt.is.null");
  });

  it("supabase can nest extra or filters for search", () => {
    const and = supabasePublishedVisibilityAndWith(
      ["or(title.ilike.*foo*,excerpt.ilike.*foo*)"],
      fixed
    );
    expect(and).toContain("title.ilike.*foo*");
    expect(and).toContain("status.eq.PUBLISHED");
  });
});
