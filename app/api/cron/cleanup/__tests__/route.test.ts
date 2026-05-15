import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/infrastructure/db/adapters/audit.prisma-adapter", () => ({
  cleanupAuditLogs: jest.fn(),
  cleanupPageViews: jest.fn(),
}));
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { cleanupAuditLogs, cleanupPageViews } from "@/infrastructure/db/adapters/audit.prisma-adapter";
import { GET } from "../route";

const cleanupAuditLogsMock = jest.mocked(cleanupAuditLogs);
const cleanupPageViewsMock = jest.mocked(cleanupPageViews);

describe("GET /api/cron/cleanup", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
    process.env["CRON_SECRET"] = "cron-secret";
    cleanupPageViewsMock.mockResolvedValue(2);
    cleanupAuditLogsMock.mockResolvedValue(3);
    prismaMock.eventOutbox.findMany.mockResolvedValue([]);
  });

  it("fails closed when CRON_SECRET is missing", async () => {
    delete process.env["CRON_SECRET"];

    const response = await GET(new Request("http://localhost/api/cron/cleanup") as never);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "CRON_SECRET_REQUIRED" });
  });

  it("rejects invalid bearer token", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/cleanup", {
        headers: { Authorization: "Bearer wrong" },
      }) as never
    );

    expect(response.status).toBe(401);
  });

  it("runs cleanup and processes outbox when authorized", async () => {
    prismaMock.eventOutbox.findMany.mockResolvedValue([{ id: "evt-1", eventType: "POST_PUBLISHED" }]);
    prismaMock.eventOutbox.update.mockResolvedValue({});

    const response = await GET(
      new Request("http://localhost/api/cron/cleanup", {
        headers: { Authorization: "Bearer cron-secret" },
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deletedPageViews).toBe(2);
    expect(body.deletedAuditLogs).toBe(3);
    expect(body.processedEvents).toBe(1);
    expect(prismaMock.eventOutbox.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "evt-1" } })
    );
  });
});
