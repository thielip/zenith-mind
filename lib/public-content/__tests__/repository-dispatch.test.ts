jest.mock("@/lib/public-content/runtime", () => ({
  isPublicCfBackend: jest.fn(),
}));

jest.mock("@/infrastructure/content/public-read-supabase.repository", () => ({
  publicReadSupabaseRepository: { backend: "supabase" },
}));

jest.mock("@/infrastructure/content/public-read-prisma.repository", () => ({
  publicReadPrismaRepository: { backend: "prisma" },
}));

import { isPublicCfBackend } from "@/lib/public-content/runtime";
import { getPublicReadRepository } from "@/lib/public-content/get-repository";

describe("getPublicReadRepository dispatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads Supabase repository when CF backend", async () => {
    jest.mocked(isPublicCfBackend).mockReturnValue(true);
    const repo = await getPublicReadRepository();
    expect(repo).toEqual({ backend: "supabase" });
  });

  it("loads Prisma repository when not CF backend", async () => {
    jest.mocked(isPublicCfBackend).mockReturnValue(false);
    const repo = await getPublicReadRepository();
    expect(repo).toEqual({ backend: "prisma" });
  });
});
