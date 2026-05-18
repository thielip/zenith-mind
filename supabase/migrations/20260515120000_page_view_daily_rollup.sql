-- PageView → DailyAggregate 日彙總 + 公開讀取 View（避免 COUNT(*) 全表掃描）
-- 在 Supabase SQL Editor 執行，或透過 supabase db push

-- ── 1. service_role 讀取權限（修復 PostgREST 403 permission denied）──
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- ── 2. 首頁瀏覽（postId IS NULL）日彙總表 ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_daily_aggregates (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date            DATE NOT NULL,
  locale          TEXT NOT NULL DEFAULT 'zh-TW',
  views           INTEGER NOT NULL DEFAULT 0,
  "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT site_daily_aggregates_date_locale_key UNIQUE (date, locale)
);

CREATE INDEX IF NOT EXISTS site_daily_aggregates_locale_date_idx
  ON public.site_daily_aggregates (locale, date DESC);

-- ── 3. 日彙總函式（Cron 每日呼叫）────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_page_view_daily_aggregates(
  p_day DATE DEFAULT (CURRENT_DATE - INTERVAL '1 day')::date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 文章：寫入 daily_aggregates
  INSERT INTO public.daily_aggregates (id, date, views, "uniqueVisitors", "postId")
  SELECT
    gen_random_uuid()::text,
    p_day::timestamp AT TIME ZONE 'UTC',
    COUNT(*)::integer,
    COUNT(DISTINCT "visitorHash")::integer,
    "postId"
  FROM public.page_views
  WHERE "postId" IS NOT NULL
    AND "createdAt" >= p_day::timestamp
    AND "createdAt" < (p_day + INTERVAL '1 day')::timestamp
  GROUP BY "postId"
  ON CONFLICT (date, "postId")
  DO UPDATE SET
    views = EXCLUDED.views,
    "uniqueVisitors" = EXCLUDED."uniqueVisitors";

  -- 首頁：寫入 site_daily_aggregates
  INSERT INTO public.site_daily_aggregates (date, locale, views, "uniqueVisitors")
  SELECT
    p_day,
    locale,
    COUNT(*)::integer,
    COUNT(DISTINCT "visitorHash")::integer
  FROM public.page_views
  WHERE "postId" IS NULL
    AND "createdAt" >= p_day::timestamp
    AND "createdAt" < (p_day + INTERVAL '1 day')::timestamp
  GROUP BY locale
  ON CONFLICT (date, locale)
  DO UPDATE SET
    views = EXCLUDED.views,
    "uniqueVisitors" = EXCLUDED."uniqueVisitors";
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_page_view_daily_aggregates(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_page_view_daily_aggregates(DATE) TO service_role;

-- ── 4. 讀取用 View：歷史彙總 + 當日即時（小範圍 page_views）──────────
CREATE OR REPLACE VIEW public.v_post_view_totals AS
SELECT
  p.id AS post_id,
  (
    COALESCE(da.hist_views, 0)
    + COALESCE(today.today_views, 0)
  )::integer AS view_count
FROM public.posts p
LEFT JOIN (
  SELECT "postId", SUM(views)::integer AS hist_views
  FROM public.daily_aggregates
  GROUP BY "postId"
) da ON da."postId" = p.id
LEFT JOIN (
  SELECT "postId", COUNT(*)::integer AS today_views
  FROM public.page_views
  WHERE "postId" IS NOT NULL
    AND "createdAt" >= date_trunc('day', (NOW() AT TIME ZONE 'UTC'))
  GROUP BY "postId"
) today ON today."postId" = p.id
WHERE p.status::text = 'PUBLISHED'
  AND p."deletedAt" IS NULL;

CREATE OR REPLACE VIEW public.v_site_view_totals AS
SELECT
  loc.locale,
  (
    COALESCE(h.hist_views, 0)
    + COALESCE(t.today_views, 0)
  )::integer AS view_count
FROM (
  SELECT DISTINCT locale FROM public.page_views WHERE "postId" IS NULL
  UNION
  SELECT DISTINCT locale FROM public.site_daily_aggregates
) loc(locale)
LEFT JOIN (
  SELECT locale, SUM(views)::integer AS hist_views
  FROM public.site_daily_aggregates
  GROUP BY locale
) h ON h.locale = loc.locale
LEFT JOIN (
  SELECT locale, COUNT(*)::integer AS today_views
  FROM public.page_views
  WHERE "postId" IS NULL
    AND "createdAt" >= date_trunc('day', (NOW() AT TIME ZONE 'UTC'))
  GROUP BY locale
) t ON t.locale = loc.locale;

GRANT SELECT ON public.v_post_view_totals TO service_role, anon, authenticated;
GRANT SELECT ON public.v_site_view_totals TO service_role, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_daily_aggregates TO service_role;

-- ── 5. 可選：首次部署回填最近 30 天（大量資料請改由腳本分批執行）──
-- SELECT public.refresh_page_view_daily_aggregates(d::date)
-- FROM generate_series(CURRENT_DATE - 30, CURRENT_DATE - 1, '1 day'::interval) AS d;
