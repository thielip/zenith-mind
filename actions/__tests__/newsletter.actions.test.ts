import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

jest.mock("@/infrastructure/db/prisma", () => ({
  prisma: require("@/test-utils/prisma-mock").prismaMock,
}));

import { subscribeNewsletterAction } from "../newsletter.actions";

describe("subscribeNewsletterAction", () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
  });

  it("rejects invalid email", async () => {
    const result = await subscribeNewsletterAction({ email: "not-email" });

    expect(result.success).toBe(false);
    expect(prismaMock.newsletterSubscriber.upsert).not.toHaveBeenCalled();
  });

  it("normalizes and upserts subscribers", async () => {
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(null);
    prismaMock.newsletterSubscriber.upsert.mockResolvedValue({});

    const result = await subscribeNewsletterAction({
      email: " USER@Example.COM ",
      locale: "zh-TW",
      source: "test",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ email: "user@example.com", alreadySubscribed: false });
    expect(prismaMock.newsletterSubscriber.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "user@example.com" } })
    );
  });

  it("marks active existing subscribers", async () => {
    prismaMock.newsletterSubscriber.findUnique.mockResolvedValue({ id: "sub-1", status: "ACTIVE" });
    prismaMock.newsletterSubscriber.upsert.mockResolvedValue({});

    const result = await subscribeNewsletterAction({ email: "user@example.com" });

    expect(result.success).toBe(true);
    expect(result.data?.alreadySubscribed).toBe(true);
  });
});
