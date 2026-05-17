-- Production hotfix: ad_slots only (posts columns already exist)
CREATE TABLE IF NOT EXISTS "ad_slots" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "ad_slots_slotKey_locale_key" ON "ad_slots"("slotKey", "locale");
CREATE INDEX IF NOT EXISTS "ad_slots_isActive_slotKey_locale_idx" ON "ad_slots"("isActive", "slotKey", "locale");
