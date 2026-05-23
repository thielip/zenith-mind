import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/lib/events/process-event-outbox", () => ({
  processEventOutbox: jest.fn(),
}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { processEventOutbox } from "@/lib/events/process-event-outbox";
import { GET } from "../route";

const processEventOutboxMock = jest.mocked(processEventOutbox);

describe("GET /api/cron/outbox", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
    process.env["CRON_SECRET"] = "cron-secret";
    processEventOutboxMock.mockResolvedValue(2);
  });

  it("rejects missing CRON_SECRET", async () => {
    delete process.env["CRON_SECRET"];
    const res = await GET(new Request("http://localhost/api/cron/outbox") as never);
    expect(res.status).toBe(401);
  });

  it("processes outbox when authorized", async () => {
    const res = await GET(
      new Request("http://localhost/api/cron/outbox", {
        headers: { Authorization: "Bearer cron-secret" },
      }) as never
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.processed).toBe(2);
    expect(processEventOutboxMock).toHaveBeenCalled();
  });
});
