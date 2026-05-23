type MockModel = Record<string, jest.Mock>;

function model(methods: string[]): MockModel {
  return Object.fromEntries(methods.map((name) => [name, jest.fn()]));
}

export const prismaMock: Record<string, any> = {
  user: model(["findFirst", "findUnique", "update", "upsert", "count"]),
  post: model(["findMany", "findFirst", "findUnique", "findUniqueOrThrow", "count", "create", "update", "updateMany", "deleteMany"]),
  category: model(["findMany", "count"]),
  tag: model(["findMany"]),
  postTag: model(["findMany", "deleteMany", "createMany"]),
  seoMetadata: model(["upsert", "deleteMany"]),
  pageView: model(["create", "count"]),
  affiliateLink: model(["findUnique", "findFirst", "findMany", "count", "create", "update", "updateMany", "delete", "deleteMany"]),
  adSlot: model(["findFirst", "findMany"]),
  aiJob: model(["findFirst", "findUnique", "findUniqueOrThrow", "findMany", "create", "update", "updateMany", "count"]),
  auditLog: model(["create", "findMany", "count", "deleteMany"]),
  eventOutbox: model(["findMany", "create", "update", "updateMany"]),
  siteSettings: model(["findUnique", "upsert", "updateMany"]),
  heroSlide: model(["findMany", "createMany", "deleteMany"]),
  homeCarouselItem: model(["findMany", "createMany", "deleteMany"]),
  $transaction: jest.fn(async (callback: unknown): Promise<unknown> => {
    if (typeof callback === "function") {
      return callback(prismaMock);
    }
    return callback;
  }),
};

export function resetPrismaMock() {
  for (const value of Object.values(prismaMock)) {
    if (typeof value === "function" && "mockReset" in value) {
      (value as jest.Mock).mockReset();
      continue;
    }

    if (value && typeof value === "object") {
      for (const fn of Object.values(value)) {
        if (typeof fn === "function" && "mockReset" in fn) {
          (fn as jest.Mock).mockReset();
        }
      }
    }
  }
}
