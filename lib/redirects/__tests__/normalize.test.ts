import {
  isSelfRedirect,
  mergeRedirectSearch,
  normalizeRedirectPathname,
  parseRedirectPath,
  redirectPathnamesEqual,
} from "@/lib/redirects/normalize";

describe("redirect normalize", () => {
  it("strips trailing slash", () => {
    expect(normalizeRedirectPathname("/blog/test/")).toBe("/blog/test");
    expect(normalizeRedirectPathname("/")).toBe("/");
  });

  it("parses path without query for lookup", () => {
    expect(parseRedirectPath("/blog/test?fbclid=xxx")).toEqual({
      pathname: "/blog/test",
      search: "?fbclid=xxx",
    });
  });

  it("treats slash and query variants as equal pathnames", () => {
    expect(redirectPathnamesEqual("/blog/test", "/blog/test/")).toBe(true);
    expect(
      redirectPathnamesEqual("/blog/test", "/blog/test?fbclid=1")
    ).toBe(true);
  });

  it("detects self redirect", () => {
    expect(isSelfRedirect("/a", "/a")).toBe(true);
    expect(isSelfRedirect("/a", "/a/")).toBe(true);
    expect(isSelfRedirect("/a", "/b")).toBe(false);
    expect(isSelfRedirect("/blog/x", "/blog/x?ref=1")).toBe(true);
  });

  it("merges query with rule taking precedence", () => {
    expect(mergeRedirectSearch("?category=a", "?fbclid=1")).toBe(
      "?category=a&fbclid=1"
    );
    expect(mergeRedirectSearch("?category=a", "?category=b")).toBe(
      "?category=a"
    );
  });
});
