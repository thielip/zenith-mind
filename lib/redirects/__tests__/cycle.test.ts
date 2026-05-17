import {
  MAX_REDIRECT_CHAIN_DEPTH,
  resolveSafeFirstRedirectHop,
  wouldCreateRedirectCycle,
} from "@/lib/redirects/cycle";

describe("redirect cycle", () => {
  const rules: Record<string, string> = {
    "/a": "/b",
    "/b": "/a",
    "/x": "/y",
    "/y": "/z",
    "/z": "/x",
    "/one": "/two",
    "/two": "/three",
    "/three": "/four",
  };

  async function lookup(pathname: string) {
    const dest = rules[pathname];
    if (!dest) return null;
    return { newPath: dest, statusCode: 301 };
  }

  it("blocks A↔B ping-pong", async () => {
    expect(await resolveSafeFirstRedirectHop("/a", lookup)).toBeNull();
  });

  it("blocks 3-hop cycle back to start", async () => {
    expect(await resolveSafeFirstRedirectHop("/x", lookup)).toBeNull();
  });

  it("allows safe single hop", async () => {
    const hit = await resolveSafeFirstRedirectHop("/one", lookup);
    expect(hit).toEqual({ newPath: "/two", statusCode: 301 });
  });

  it("blocks chain deeper than max when writing", async () => {
    const deep: Record<string, string> = {};
    for (let i = 0; i < MAX_REDIRECT_CHAIN_DEPTH + 2; i++) {
      deep[`/p${i}`] = `/p${i + 1}`;
    }
    const deepLookup = async (p: string) => {
      const d = deep[p];
      return d ? { newPath: d } : null;
    };
    expect(
      await wouldCreateRedirectCycle("/p0", "/p1", deepLookup)
    ).toBe(false);
    expect(
      await wouldCreateRedirectCycle("/new", "/p0", deepLookup)
    ).toBe(false);
  });

  it("detects bidirectional on write", async () => {
    expect(await wouldCreateRedirectCycle("/a", "/b", lookup)).toBe(true);
    expect(await wouldCreateRedirectCycle("/c", "/d", lookup)).toBe(false);
  });
});
