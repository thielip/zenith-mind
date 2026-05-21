export const env = new Proxy({} as Record<string, string | undefined>, {
  get(_target, property) {
    if (typeof property !== "string") return undefined;
    const defaults: Record<string, string> = {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/test",
      JWT_ACCESS_SECRET: "a".repeat(64),
      JWT_REFRESH_SECRET: "b".repeat(64),
      UPSTASH_REDIS_REST_URL: "https://example.com",
      UPSTASH_REDIS_REST_TOKEN: "test-token",
      TOTP_ENCRYPTION_KEY: "c".repeat(64),
      GEMINI_API_KEY: "AIza-test-key",
      GA4_CLIENT_EMAIL: "ga4@example.com",
      GA4_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\n".padEnd(120, "x"),
      GA4_PROPERTY_ID: "123456",
      WEBHOOK_SECRET: "webhook-secret-webhook-secret-webhook",
      CRON_SECRET: "cron-secret-cron-secret-cron-secret-cr",
      PAGEVIEW_HASH_SALT: "pageview-salt-pageview-salt-pageview-s",
      REDIRECT_LOOKUP_SECRET: "redirect-secret-redirect-secret-red",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      NEXT_PUBLIC_GA4_MEASUREMENT_ID: "G-4C955FQCZ2",
      NEXT_PUBLIC_GTM_ID: "GTM-XXXXXXX",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    };
    return process.env[property] ?? defaults[property];
  },
});
