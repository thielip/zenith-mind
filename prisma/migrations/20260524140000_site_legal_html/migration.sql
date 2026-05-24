-- 法律頁改為 HTML 編輯（保留舊 JSON 段落供遷移）
ALTER TABLE "site_settings"
ADD COLUMN IF NOT EXISTS "privacyPolicyHtml" TEXT,
ADD COLUMN IF NOT EXISTS "privacyPolicyHtmlEn" TEXT,
ADD COLUMN IF NOT EXISTS "termsOfServiceHtml" TEXT,
ADD COLUMN IF NOT EXISTS "termsOfServiceHtmlEn" TEXT;
