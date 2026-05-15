import "@testing-library/jest-dom";

process.env["SKIP_ENV_VALIDATION"] = "1";
if (!process.env["NODE_ENV"]) {
  (process.env as Record<string, string>)["NODE_ENV"] = "test";
}
process.env["DATABASE_URL"] ??= "postgresql://user:pass@localhost:5432/test";
process.env["DIRECT_URL"] ??= "postgresql://user:pass@localhost:5432/test";
process.env["JWT_ACCESS_SECRET"] ??= "a".repeat(64);
process.env["JWT_REFRESH_SECRET"] ??= "b".repeat(64);
process.env["UPSTASH_REDIS_REST_URL"] ??= "https://example.com";
process.env["UPSTASH_REDIS_REST_TOKEN"] ??= "test-token";
process.env["TOTP_ENCRYPTION_KEY"] ??= "c".repeat(64);
process.env["GEMINI_API_KEY"] ??= "AIza-test-key";
process.env["GA4_CLIENT_EMAIL"] ??= "ga4@example.com";
process.env["GA4_PRIVATE_KEY"] ??= "-----BEGIN PRIVATE KEY-----\\n".padEnd(120, "x");
process.env["GA4_PROPERTY_ID"] ??= "123456";
process.env["WEBHOOK_SECRET"] ??= "webhook-secret-webhook-secret-webhook";
process.env["CRON_SECRET"] ??= "cron-secret";
process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "service-role-key";
process.env["NEXT_PUBLIC_SITE_URL"] ??= "https://example.com";
process.env["NEXT_PUBLIC_GA4_MEASUREMENT_ID"] ??= "G-4C955FQCZ2";
process.env["NEXT_PUBLIC_SUPABASE_URL"] ??= "https://example.supabase.co";
process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ??= "anon-key";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));
