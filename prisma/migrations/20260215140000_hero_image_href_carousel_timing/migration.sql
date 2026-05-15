-- 補齊 Post 封面與內容欄位（舊庫若未套用先前 migration 時，文章頁 Prisma 會查詢失敗）
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coverImageWidth" INTEGER;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coverImageHeight" INTEGER;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "coverImageBlurHash" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "contentBlocks" JSONB;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "contentDoc" JSONB;

-- 首頁大圖／小圖輪播自動播放間隔（秒，0=關閉）
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "heroAutoplaySeconds" INTEGER;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "carouselAutoplaySeconds" INTEGER;
UPDATE "site_settings"
SET
  "heroAutoplaySeconds" = COALESCE("heroAutoplaySeconds", 8),
  "carouselAutoplaySeconds" = COALESCE("carouselAutoplaySeconds", 6)
WHERE "id" = 'site';

-- Hero：點擊大圖導向（外部或站內連結）
ALTER TABLE "hero_slides" ADD COLUMN IF NOT EXISTS "imageHref" TEXT;
