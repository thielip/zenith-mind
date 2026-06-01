import { loadCommandCenterModuleDefinition } from "@/server/command-center/registry/module-loaders";
import {
  getCommandCenterModuleMeta,
  loadCommandCenterModule,
} from "../index";

jest.mock("@/server/command-center/modules/seo/module", () => ({
  seoCommandCenterModule: {
    id: "seo",
    title: "SEO Intelligence",
    route: "/admin/dashboard/seo",
    revalidate: 60,
    schema: {
      safeParse: (data: unknown) => ({ success: true, data }),
    },
    load: jest.fn(async () => ({
      gscOk: true,
      kpis: [],
      keywords: [],
      landingPages: [],
      cwv: { lcp: 2, inp: 100, cls: 0.05 },
      indexCoverage: 90,
      errorHealth: { notFound: 0, serverError: 0 },
    })),
  },
}));

describe("command-center registry", () => {
  it("exposes lightweight manifest without loading module chunk", () => {
    const meta = getCommandCenterModuleMeta("seo");
    expect(meta?.route).toBe("/admin/dashboard/seo");
    expect(meta?.revalidate).toBe(60);
  });

  it("loads seo through dynamic loader with schema validation", async () => {
    const mod = await loadCommandCenterModuleDefinition("seo");
    expect(mod?.id).toBe("seo");
    const data = await loadCommandCenterModule("seo");
    expect(data.gscOk).toBe(true);
    expect(data.indexCoverage).toBe(90);
  });
});
