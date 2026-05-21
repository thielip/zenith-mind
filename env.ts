// env.ts — t3-env 型別安全環境變數（根目錄）
// build time 驗證，缺少任一 server 變數即 build 失敗
// ⚠ 任何 secret 禁止使用 NEXT_PUBLIC_ 前綴

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/** 非核心 env：空字串視為未設定，避免占位值阻擋 build */
const optionalNonEmptyString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional()
);

export const env = createEnv({
  server: {
    // ── 資料庫 ────────────────────────────────────────────
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),

    // ── JWT ──────────────────────────────────────────────
    JWT_ACCESS_SECRET: z.string().min(64),
    JWT_REFRESH_SECRET: z.string().min(64),

    // ── Upstash Redis（Token 黑名單 + AI Queue）──────────
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    // ── TOTP 2FA（64 字元 hex = 32 bytes AES-256）────────
    TOTP_ENCRYPTION_KEY: z.string().length(64),

    // ── Gemini（Admin 後台 AI，OpenAI 相容介面，絕不可 NEXT_PUBLIC_）
    GEMINI_API_KEY: z.string().startsWith("AIza"),

    // ── GA4 Reporting API（Service Account 拆分儲存）─────
    GA4_CLIENT_EMAIL: z.string().email(),
    GA4_PRIVATE_KEY: z.string().min(100),       // PEM 格式私鑰
    GA4_PROPERTY_ID: z.string().regex(/^\d+$/),

    // ── Webhook 防偽 Secret ────────────────────────────
    WEBHOOK_SECRET: z.string().min(32),
    REVALIDATE_SECRET: z.string().min(32).optional(),

    // ── Cron / 公開 API 簽章（部署缺漏時執行期 401/503）──
    CRON_SECRET: z.string().min(32),
    PAGEVIEW_HASH_SALT: z.string().min(32),
    REDIRECT_LOOKUP_SECRET: z.string().min(32),

    // ── Supabase Storage（媒體上傳）────────────────────
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // ── Alert 通知（格式於 lib/alert/resolve-alert-email 執行期驗證）
    ALERT_EMAIL_USER: optionalNonEmptyString,
    ALERT_EMAIL_PASS: optionalNonEmptyString,
    ALERT_EMAIL_TO: optionalNonEmptyString,

    // ── 運行環境 ─────────────────────────────────────────
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  client: {
    // GA4 測量 ID（非 API 金鑰，公開可見）
    NEXT_PUBLIC_GA4_MEASUREMENT_ID: z.string().startsWith("G-").optional(),

    // Google Tag Manager（行銷自行埋點，不需改程式）
    NEXT_PUBLIC_GTM_ID: z.string().startsWith("GTM-").min(6).optional(),

    // Umami（Website ID 設計為公開）
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().uuid().optional(),

    // Cloudflare Turnstile Site Key（公開，非 secret）
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),

    // 站點 URL
    NEXT_PUBLIC_SITE_URL: z.string().url(),

    // Supabase 公開 URL
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },

  runtimeEnv: {
    DATABASE_URL:               process.env["DATABASE_URL"],
    DIRECT_URL:                 process.env["DIRECT_URL"],
    JWT_ACCESS_SECRET:          process.env["JWT_ACCESS_SECRET"],
    JWT_REFRESH_SECRET:         process.env["JWT_REFRESH_SECRET"],
    UPSTASH_REDIS_REST_URL:     process.env["UPSTASH_REDIS_REST_URL"],
    UPSTASH_REDIS_REST_TOKEN:   process.env["UPSTASH_REDIS_REST_TOKEN"],
    TOTP_ENCRYPTION_KEY:        process.env["TOTP_ENCRYPTION_KEY"],
    GEMINI_API_KEY:             process.env["GEMINI_API_KEY"],
    GA4_CLIENT_EMAIL:           process.env["GA4_CLIENT_EMAIL"],
    GA4_PRIVATE_KEY:            process.env["GA4_PRIVATE_KEY"],
    GA4_PROPERTY_ID:            process.env["GA4_PROPERTY_ID"],
    WEBHOOK_SECRET:             process.env["WEBHOOK_SECRET"],
    REVALIDATE_SECRET:          process.env["REVALIDATE_SECRET"],
    CRON_SECRET:                process.env["CRON_SECRET"],
    PAGEVIEW_HASH_SALT:         process.env["PAGEVIEW_HASH_SALT"],
    REDIRECT_LOOKUP_SECRET:     process.env["REDIRECT_LOOKUP_SECRET"],
    SUPABASE_SERVICE_ROLE_KEY:  process.env["SUPABASE_SERVICE_ROLE_KEY"],
    ALERT_EMAIL_USER:           process.env["ALERT_EMAIL_USER"],
    ALERT_EMAIL_PASS:           process.env["ALERT_EMAIL_PASS"],
    ALERT_EMAIL_TO:             process.env["ALERT_EMAIL_TO"],
    NODE_ENV:                   process.env["NODE_ENV"],
    NEXT_PUBLIC_GA4_MEASUREMENT_ID:  process.env["NEXT_PUBLIC_GA4_MEASUREMENT_ID"],
    NEXT_PUBLIC_GTM_ID:              process.env["NEXT_PUBLIC_GTM_ID"],
    NEXT_PUBLIC_UMAMI_WEBSITE_ID:    process.env["NEXT_PUBLIC_UMAMI_WEBSITE_ID"],
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:  process.env["NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
    NEXT_PUBLIC_SITE_URL:            process.env["NEXT_PUBLIC_SITE_URL"],
    NEXT_PUBLIC_SUPABASE_URL:        process.env["NEXT_PUBLIC_SUPABASE_URL"],
    NEXT_PUBLIC_SUPABASE_ANON_KEY:   process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  },

  skipValidation:
    !!process.env["SKIP_ENV_VALIDATION"] ||
    process.env["npm_lifecycle_event"] === "lint",
});
