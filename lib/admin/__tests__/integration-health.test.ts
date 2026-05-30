import { summarizeHealth } from "@/lib/admin/integration-health";
import type { IntegrationHealthItem } from "@/lib/admin/integration-health.types";

jest.mock("@/services/google/bigquery", () => ({
  fetchBigQueryHealth: jest.fn(async () => ({ ok: true, message: "bq ok" })),
}));
jest.mock("@/infrastructure/health/probes", () => ({
  probeDatabase: jest.fn(async () => ({ ok: true, message: "db ok" })),
  probeRedis: jest.fn(async () => ({ ok: true, message: "redis ok" })),
  probeSupabaseStorage: jest.fn(async () => ({ ok: true, message: "storage ok" })),
  probeGemini: jest.fn(async () => ({ ok: true, message: "gemini ok" })),
  probeGa4Reporting: jest.fn(async () => ({ ok: true, message: "ga4 ok" })),
  probeGoogleAdsOAuth: jest.fn(async () => ({ ok: true, message: "ads ok" })),
  probeSearchConsole: jest.fn(async () => ({ ok: true, message: "gsc ok" })),
}));

describe("summarizeHealth", () => {
  it("counts statuses", () => {
    const items: IntegrationHealthItem[] = [
      {
        id: "a",
        name: "A",
        description: "",
        status: "ok",
        missing: [],
      },
      {
        id: "b",
        name: "B",
        description: "",
        status: "missing",
        missing: ["X"],
      },
      {
        id: "c",
        name: "C",
        description: "",
        status: "error",
        missing: [],
        detail: "fail",
      },
    ];
    expect(summarizeHealth(items)).toEqual({ ok: 1, missing: 1, error: 1 });
  });
});

describe("runIntegrationHealthChecks", () => {
  const requiredEnv: Record<string, string> = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/test",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "token",
    SUPABASE_SERVICE_ROLE_KEY: "service-role",
    GEMINI_API_KEY: "AIzaSyTestKey123456789012345678901",
    JWT_ACCESS_SECRET: "a".repeat(64),
    JWT_REFRESH_SECRET: "b".repeat(64),
    TOTP_ENCRYPTION_KEY: "c".repeat(64),
    WEBHOOK_SECRET: "webhook-secret-webhook-secret-webhook",
    CRON_SECRET: "cron-secret-cron-secret-cron-secret-cr",
    REVALIDATE_SECRET: "revalidate-secret-revalidate-secret-rev",
    REDIRECT_LOOKUP_SECRET: "redirect-lookup-secret-redirect-look",
    PAGEVIEW_HASH_SALT: "pageview-hash-salt-pageview-hash-salt-pa",
    NEXT_PUBLIC_SITE_URL: "https://example.com",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    ALERT_EMAIL_TO: "alert@example.com",
    GA4_CLIENT_EMAIL: "ga4@my-project.iam.gserviceaccount.com",
    GA4_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\n".padEnd(120, "x"),
    GA4_PROPERTY_ID: "123",
    NEXT_PUBLIC_GA4_MEASUREMENT_ID: "G-TEST12345",
    GOOGLE_ADS_CLIENT_ID: "client",
    GOOGLE_ADS_CLIENT_SECRET: "secret",
    GOOGLE_ADS_REFRESH_TOKEN: "refresh",
    GOOGLE_ADS_DEVELOPER_TOKEN: "dev-token",
    GOOGLE_ADS_CUSTOMER_ID: "123",
    GOOGLE_SEARCH_CONSOLE_SITE_URL: "https://www.example.com",
    GOOGLE_MERCHANT_CENTER_ACCOUNT_ID: "5788433025",
    BIGQUERY_DATASET_ID: "my_dataset",
  };

  beforeEach(() => {
    Object.assign(process.env, requiredEnv);
  });

  it("returns probed ok items when env is complete", async () => {
    const { runIntegrationHealthChecks } = await import(
      "@/lib/admin/integration-health"
    );
    const report = await runIntegrationHealthChecks();
    const postgres = report.items.find((i) => i.id === "postgres");
    expect(postgres?.status).toBe("ok");
    expect(postgres?.detail).toBe("db ok");
    expect(report.summary.ok).toBeGreaterThan(0);
  });

  it("skips database probe when databaseProbe is provided", async () => {
    const { probeDatabase } = await import("@/infrastructure/health/probes");
    const { runIntegrationHealthChecks } = await import(
      "@/lib/admin/integration-health"
    );
    const report = await runIntegrationHealthChecks({
      databaseProbe: { ok: true, message: "已驗證" },
    });
    expect(probeDatabase).not.toHaveBeenCalled();
    const postgres = report.items.find((i) => i.id === "postgres");
    expect(postgres?.detail).toBe("已驗證");
  });
});
