-- refresh_page_view_daily_aggregates 寫入 site_daily_aggregates 時補上 id（修復 23502）
CREATE OR REPLACE FUNCTION public.refresh_page_view_daily_aggregates(
  p_day DATE DEFAULT (CURRENT_DATE - INTERVAL '1 day')::date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

  INSERT INTO public.site_daily_aggregates (id, date, locale, views, "uniqueVisitors")
  SELECT
    gen_random_uuid()::text,
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

GRANT EXECUTE ON FUNCTION public.refresh_page_view_daily_aggregates(DATE) TO service_role;
