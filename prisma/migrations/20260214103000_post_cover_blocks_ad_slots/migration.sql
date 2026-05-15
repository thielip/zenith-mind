-- AlterTable: Post 封面契約欄位 + 結構化內容 JSON + Tiptap 文件快照
ALTER TABLE "posts"
  ADD COLUMN "coverImageWidth" INTEGER,
  ADD COLUMN "coverImageHeight" INTEGER,
  ADD COLUMN "coverImageBlurHash" TEXT,
  ADD COLUMN "contentBlocks" JSONB,
  ADD COLUMN "contentDoc" JSONB;

-- CreateTable: 廣告位（與樣式分離；圖片帶寬高與 alt 以利 LCP/CLS）
CREATE TABLE "ad_slots" (
    "id" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'zh-TW',
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "imageAlt" TEXT NOT NULL,
    "blurHash" TEXT,
    "href" TEXT,
    "aspectRatio" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ad_slots_slotKey_locale_key" ON "ad_slots"("slotKey", "locale");
CREATE INDEX "ad_slots_isActive_slotKey_locale_idx" ON "ad_slots"("isActive", "slotKey", "locale");
