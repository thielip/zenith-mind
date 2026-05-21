CREATE TABLE IF NOT EXISTS "affiliate_link_click_daily" (
  "affiliateLinkId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "affiliate_link_click_daily_pkey" PRIMARY KEY ("affiliateLinkId", "date")
);

CREATE INDEX IF NOT EXISTS "affiliate_link_click_daily_date_idx"
  ON "affiliate_link_click_daily"("date" DESC);

ALTER TABLE "affiliate_link_click_daily"
  ADD CONSTRAINT "affiliate_link_click_daily_affiliateLinkId_fkey"
  FOREIGN KEY ("affiliateLinkId") REFERENCES "affiliate_links"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
