import {
  deriveGcpProjectId,
  getGoogleIntegrationStatuses,
} from "@/lib/google/integration-status";

describe("deriveGcpProjectId", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("prefers GOOGLE_CLOUD_PROJECT_ID", () => {
    process.env["GOOGLE_CLOUD_PROJECT_ID"] = "explicit-project";
    process.env["GA4_CLIENT_EMAIL"] =
      "reader@other-project.iam.gserviceaccount.com";
    expect(deriveGcpProjectId()).toBe("explicit-project");
  });

  it("parses project from GA4 service account email", () => {
    delete process.env["GOOGLE_CLOUD_PROJECT_ID"];
    process.env["GA4_CLIENT_EMAIL"] =
      "ga4-api-reader@my-blog-analytics-495817.iam.gserviceaccount.com";
    expect(deriveGcpProjectId()).toBe("my-blog-analytics-495817");
  });
});

describe("getGoogleIntegrationStatuses", () => {
  it("marks GA4 missing when env incomplete", () => {
    const prev = process.env["GA4_PRIVATE_KEY"];
    delete process.env["GA4_PRIVATE_KEY"];
    const ga4 = getGoogleIntegrationStatuses().find((s) => s.name === "GA4");
    expect(ga4?.status).toBe("missing");
    expect(ga4?.missing).toContain("GA4_PRIVATE_KEY");
    if (prev) process.env["GA4_PRIVATE_KEY"] = prev;
  });
});
