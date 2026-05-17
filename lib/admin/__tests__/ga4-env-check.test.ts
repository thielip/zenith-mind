import { checkGa4Env } from "@/lib/admin/ga4-env-check";

describe("checkGa4Env", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("warns when property id equals account id", () => {
    process.env["GA4_ACCOUNT_ID"] = "394118928";
    process.env["GA4_PROPERTY_ID"] = "394118928";
    const result = checkGa4Env();
    expect(result.warnings.some((w) => w.includes("536903218"))).toBe(true);
    expect(result.isPropertyIdValid).toBe(false);
  });

  it("ok when property id is SEO部落格 resource", () => {
    process.env["GA4_ACCOUNT_ID"] = "394118928";
    process.env["GA4_PROPERTY_ID"] = "536903218";
    const result = checkGa4Env();
    expect(result.isPropertyIdValid).toBe(true);
  });
});
