import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/lib/revalidate/purge-public-site", () => ({
  purgePublicSiteAfterPostChange: jest.fn(),
}));
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

import { GET } from "../route";

describe("GET /api/cron/publish-scheduled", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
    process.env["CRON_SECRET"] = "cron-secret";
  });

  it("fails closed when CRON_SECRET is missing", async () => {
    delete process.env["CRON_SECRET"];

    const response = await GET(
      new Request("http://localhost/api/cron/publish-scheduled") as never
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "CRON_SECRET_REQUIRED" });
  });

  it("rejects invalid bearer token", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/publish-scheduled", {
        headers: { Authorization: "Bearer wrong" },
      }) as never
    );

    expect(response.status).toBe(401);
  });

  it("returns zero when no due posts", async () => {
    prismaMock.post.findMany.mockResolvedValue([]);

    const response = await GET(
      new Request("http://localhost/api/cron/publish-scheduled", {
        headers: { Authorization: "Bearer cron-secret" },
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ published: 0, slugs: [] });
  });

  it("publishes due scheduled posts and skips empty content", async () => {
    prismaMock.post.findMany.mockResolvedValue([
      {
        id: "p1",
        slug: "ready-post",
        scheduledAt: new Date("2026-01-01T00:00:00Z"),
        content: "<p>Hello</p>",
      },
      {
        id: "p2",
        slug: "empty-post",
        scheduledAt: new Date("2026-01-01T00:00:00Z"),
        content: "   ",
      },
    ]);
    prismaMock.post.update.mockResolvedValue({});

    const response = await GET(
      new Request("http://localhost/api/cron/publish-scheduled", {
        headers: { Authorization: "Bearer cron-secret" },
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.published).toBe(1);
    expect(body.slugs).toEqual(["ready-post"]);
    expect(body.skipped).toEqual(["empty-post"]);
    expect(prismaMock.post.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p1" },
        data: expect.objectContaining({ status: "PUBLISHED" }),
      })
    );
  });
});
