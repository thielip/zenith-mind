import { createHmac } from "crypto";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));
jest.mock("@/env", () => ({
  env: require("@/test-utils/env-mock").env,
}));
jest.mock("@/infrastructure/redis/webhook-nonce", () => ({
  consumeWebhookNonce: jest.fn(),
}));
jest.mock("@/lib/security/rate-limit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 59 }),
  rateLimitKeyIp: (ip: string, route: string) => `${route}:${ip}`,
}));

import { consumeWebhookNonce } from "@/infrastructure/redis/webhook-nonce";
import { POST } from "../route";

const consumeWebhookNonceMock = jest.mocked(consumeWebhookNonce);

function signedRequest(body: string, overrides: Record<string, string> = {}) {
  const timestamp = overrides["x-webhook-timestamp"] ?? String(Date.now());
  const signature =
    overrides["x-webhook-signature"] ??
    createHmac("sha256", process.env["WEBHOOK_SECRET"] ?? "")
      .update(`${timestamp}.${body}`)
      .digest("hex");

  return new Request("http://localhost/api/webhook", {
    method: "POST",
    headers: {
      "x-webhook-signature": signature,
      "x-webhook-timestamp": timestamp,
      "x-webhook-nonce": overrides["x-webhook-nonce"] ?? "nonce-1",
    },
    body,
  });
}

describe("POST /api/webhook", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
    process.env["WEBHOOK_SECRET"] = "webhook-secret-webhook-secret-webhook";
    consumeWebhookNonceMock.mockResolvedValue(true);
  });

  it("rejects missing signature headers", async () => {
    const response = await POST(new Request("http://localhost/api/webhook", { method: "POST" }) as never);
    expect(response.status).toBe(401);
  });

  it("rejects expired timestamps", async () => {
    const body = JSON.stringify({ event: "POST_PUBLISHED" });
    const response = await POST(
      signedRequest(body, { "x-webhook-timestamp": String(Date.now() - 10 * 60 * 1000) }) as never
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "TIMESTAMP_EXPIRED" });
  });

  it("rejects replayed nonce", async () => {
    consumeWebhookNonceMock.mockResolvedValue(false);
    const response = await POST(signedRequest(JSON.stringify({ event: "POST_PUBLISHED" })) as never);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "NONCE_REPLAYED" });
  });

  it("creates an outbox event for known events", async () => {
    const response = await POST(
      signedRequest(JSON.stringify({ event: "POST_PUBLISHED", data: { slug: "hello" } })) as never
    );

    expect(response.status).toBe(200);
    expect(prismaMock.eventOutbox.create).toHaveBeenCalledWith({
      data: { eventType: "POST_PUBLISHED", payload: { slug: "hello" } },
    });
  });
});
