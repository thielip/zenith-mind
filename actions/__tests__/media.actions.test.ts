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
jest.mock("@/infrastructure/storage/supabase-storage", () => ({
  deleteSiteAssetByPublicUrl: jest.fn(),
}));
jest.mock("@/infrastructure/db/adapters/audit.prisma-adapter", () => ({
  writeAuditLog: jest.fn(),
}));

import { cookies, headers } from "next/headers";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { deleteSiteAssetByPublicUrl } from "@/infrastructure/storage/supabase-storage";
import { deleteMediaItemAction } from "../media.actions";

const cookiesMock = jest.mocked(cookies);
const headersMock = jest.mocked(headers);
const verifyAccessTokenMock = jest.mocked(verifyAccessToken);
const deleteSiteAssetByPublicUrlMock = jest.mocked(deleteSiteAssetByPublicUrl);

describe("deleteMediaItemAction", () => {
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
    deleteSiteAssetByPublicUrlMock.mockResolvedValue({ deleted: true, reason: null });
  });

  it("requires admin auth", async () => {
    cookiesMock.mockResolvedValue(createCookieJar());

    const result = await deleteMediaItemAction({ source: "logo", url: "https://example.com/logo.png" });

    expect(result.success).toBe(false);
    expect(prismaMock.siteSettings.updateMany).not.toHaveBeenCalled();
  });

  it("clears logo URL and deletes storage object", async () => {
    prismaMock.siteSettings.updateMany.mockResolvedValue({ count: 1 });

    const result = await deleteMediaItemAction({ source: "logo", url: "https://example.com/logo.png" });

    expect(result.success).toBe(true);
    expect(prismaMock.siteSettings.updateMany).toHaveBeenCalledWith({
      where: { id: "site", logoUrl: "https://example.com/logo.png" },
      data: { logoUrl: null },
    });
    expect(deleteSiteAssetByPublicUrlMock).toHaveBeenCalledWith("https://example.com/logo.png");
  });

  it("requires entity id for hero deletion", async () => {
    const result = await deleteMediaItemAction({ source: "hero", url: "https://example.com/hero.png" });

    expect(result.success).toBe(false);
    expect(prismaMock.heroSlide.deleteMany).not.toHaveBeenCalled();
  });

  it("removes post cover references", async () => {
    prismaMock.post.updateMany.mockResolvedValue({ count: 1 });

    const result = await deleteMediaItemAction({
      source: "postCover",
      entityId: "post-1",
      url: "https://example.com/cover.png",
    });

    expect(result.success).toBe(true);
    expect(prismaMock.post.updateMany).toHaveBeenCalledWith({
      where: { id: "post-1", coverImage: "https://example.com/cover.png" },
      data: { coverImage: null, coverImageAlt: null },
    });
  });
});
