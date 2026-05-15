jest.mock("@/lib/redirects/queries", () => ({
  findActiveRedirect: jest.fn(),
}));

import { NextRequest } from "next/server";
import { findActiveRedirect } from "@/lib/redirects/queries";
import { GET } from "../route";

function req(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init);
}

const mockedFind = findActiveRedirect as jest.MockedFunction<
  typeof findActiveRedirect
>;

describe("GET /api/redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns hit when redirect exists", async () => {
    mockedFind.mockResolvedValue({
      newPath: "/zh-TW/blog?category=focus",
      statusCode: 301,
    });

    const response = await GET(
      req("http://localhost/api/redirect?path=/zh-TW/blog/old")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      hit: true,
      newPath: "/zh-TW/blog?category=focus",
      statusCode: 301,
    });
    expect(mockedFind).toHaveBeenCalledWith("/zh-TW/blog/old");
  });

  it("returns miss when no redirect", async () => {
    mockedFind.mockResolvedValue(null);

    const response = await GET(
      req("http://localhost/api/redirect?path=/zh-TW/blog/missing")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ hit: false });
  });

  it("accepts lookup when internal header matches secret", async () => {
    const prevSecret = process.env["REDIRECT_LOOKUP_SECRET"];
    process.env["REDIRECT_LOOKUP_SECRET"] = "prod-secret";
    mockedFind.mockResolvedValue(null);

    try {
      const response = await GET(
        req("http://localhost/api/redirect?path=/zh-TW/blog/old", {
          headers: { "x-redirect-internal": "prod-secret" },
        })
      );
      expect(response.status).toBe(200);
    } finally {
      if (prevSecret === undefined) {
        delete process.env["REDIRECT_LOOKUP_SECRET"];
      } else {
        process.env["REDIRECT_LOOKUP_SECRET"] = prevSecret;
      }
    }
  });
});
