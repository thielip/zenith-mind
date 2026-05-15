import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));

import { GET } from "../route";

describe("GET /go/:slug", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
  });

  it("redirects inactive or missing affiliate links to home", async () => {
    prismaMock.affiliateLink.findUnique.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/go/missing") as never, {
      params: Promise.resolve({ slug: "missing" }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects active links and increments click count", async () => {
    prismaMock.affiliateLink.findUnique.mockResolvedValue({
      id: "link-1",
      slug: "tool",
      targetUrl: "https://example.com/tool",
    });
    prismaMock.affiliateLink.update.mockResolvedValue({});

    const response = await GET(new Request("http://localhost/go/tool") as never, {
      params: Promise.resolve({ slug: "tool" }),
    });

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://example.com/tool");
    expect(prismaMock.affiliateLink.update).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: { clickCount: { increment: 1 } },
    });
  });
});
