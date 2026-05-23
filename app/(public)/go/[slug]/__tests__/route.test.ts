import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("@/lib/db/cf-public-runtime", () => ({
  isCfPublicRuntime: jest.fn().mockReturnValue(false),
}));
jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/lib/affiliate/record-click", () => ({
  recordAffiliateClick: jest.fn().mockResolvedValue(undefined),
}));

import { recordAffiliateClick } from "@/lib/affiliate/record-click";
import { GET } from "../route";

const recordAffiliateClickMock = jest.mocked(recordAffiliateClick);

describe("GET /go/:slug", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
  });

  it("redirects inactive or missing affiliate links to home", async () => {
    prismaMock.affiliateLink.findFirst.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/go/missing") as never, {
      params: Promise.resolve({ slug: "missing" }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects active links and increments click count", async () => {
    prismaMock.affiliateLink.findFirst.mockResolvedValue({
      id: "link-1",
      slug: "tool",
      targetUrl: "https://example.com/tool",
    });
    const response = await GET(new Request("http://localhost/go/tool") as never, {
      params: Promise.resolve({ slug: "tool" }),
    });

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://example.com/tool");
    expect(recordAffiliateClickMock).toHaveBeenCalledWith("link-1");
  });
});
