import { createCookieJar, createHeaders } from "@/test-utils/next-mocks";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));
jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/lib/auth/jwt", () => ({
  verifyAccessToken: jest.fn(),
}));
jest.mock("@/infrastructure/db/adapters/audit.prisma-adapter", () => ({
  writeAuditLog: jest.fn(),
}));

import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { createAffiliateLinkAction, deleteAffiliateLinkAction, updateAffiliateLinkAction } from "../affiliate.actions";

const cookiesMock = jest.mocked(cookies);
const headersMock = jest.mocked(headers);
const verifyAccessTokenMock = jest.mocked(verifyAccessToken);

describe("affiliate actions", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
    cookiesMock.mockResolvedValue(createCookieJar({ access_token: "access" }));
    headersMock.mockResolvedValue(createHeaders());
    verifyAccessTokenMock.mockResolvedValue({
      userId: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
      tokenType: "access",
    });
  });

  it("requires admin to create links", async () => {
    cookiesMock.mockResolvedValue(createCookieJar());

    const result = await createAffiliateLinkAction({
      name: "Tool",
      slug: "tool",
      targetUrl: "https://example.com",
    });

    expect(result.success).toBe(false);
    expect(prismaMock.affiliateLink.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate slugs", async () => {
    prismaMock.affiliateLink.findUnique.mockResolvedValue({ id: "existing" });

    const result = await createAffiliateLinkAction({
      name: "Tool",
      slug: "tool",
      targetUrl: "https://example.com",
    });

    expect(result.success).toBe(false);
    expect(prismaMock.affiliateLink.create).not.toHaveBeenCalled();
  });

  it("creates sanitized affiliate links", async () => {
    prismaMock.affiliateLink.findUnique.mockResolvedValue(null);
    prismaMock.affiliateLink.create.mockResolvedValue({
      id: "link-1",
      name: "Tool",
      slug: "tool",
      targetUrl: "https://example.com",
      platform: null,
      commission: null,
      isActive: true,
      clickCount: 0,
    });

    const result = await createAffiliateLinkAction({
      name: "Tool",
      slug: "tool",
      targetUrl: "https://example.com",
    });

    expect(result.success).toBe(true);
    expect(result.data?.slug).toBe("tool");
  });

  it("validates delete ids", async () => {
    const result = await deleteAffiliateLinkAction("not-cuid");

    expect(result.success).toBe(false);
    expect(prismaMock.affiliateLink.delete).not.toHaveBeenCalled();
  });

  it("requires admin to update links", async () => {
    cookiesMock.mockResolvedValue(createCookieJar());

    const result = await updateAffiliateLinkAction({
      id: "cly63t164000245zw008pggon",
      name: "X",
      targetUrl: "https://example.com",
      isActive: true,
    });

    expect(result.success).toBe(false);
    expect(prismaMock.affiliateLink.update).not.toHaveBeenCalled();
  });

  it("validates update payload", async () => {
    const result = await updateAffiliateLinkAction({
      id: "not-cuid",
      name: "X",
      targetUrl: "https://example.com",
      isActive: true,
    });

    expect(result.success).toBe(false);
    expect(prismaMock.affiliateLink.update).not.toHaveBeenCalled();
  });

  it("updates affiliate links", async () => {
    prismaMock.affiliateLink.update.mockResolvedValue({
      id: "cly63t164000245zw008pggon",
      name: "Renamed",
      slug: "tool",
      targetUrl: "https://new.example.com",
      platform: "Amazon",
      commission: "8%",
      isActive: false,
      clickCount: 3,
    });

    const result = await updateAffiliateLinkAction({
      id: "cly63t164000245zw008pggon",
      name: "Renamed",
      targetUrl: "https://new.example.com",
      platform: "Amazon",
      commission: "8%",
      isActive: false,
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Renamed");
    expect(result.data?.isActive).toBe(false);
    expect(prismaMock.affiliateLink.update).toHaveBeenCalled();
  });
});
