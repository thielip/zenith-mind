-- 隱私權政策與服務條款（CMS 可編輯 JSON 段落）
ALTER TABLE "site_settings"
ADD COLUMN IF NOT EXISTS "privacyPolicySections" JSONB,
ADD COLUMN IF NOT EXISTS "termsOfServiceSections" JSONB;
