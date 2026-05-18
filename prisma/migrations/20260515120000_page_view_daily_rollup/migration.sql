-- Mirror of supabase/migrations/20260515120000_page_view_daily_rollup.sql

CREATE TABLE IF NOT EXISTS "site_daily_aggregates" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'zh-TW',
  "views" INTEGER NOT NULL DEFAULT 0,
  "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "site_daily_aggregates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_daily_aggregates_date_locale_key"
  ON "site_daily_aggregates"("date", "locale");

CREATE INDEX IF NOT EXISTS "site_daily_aggregates_locale_date_idx"
  ON "site_daily_aggregates"("locale", "date" DESC);
