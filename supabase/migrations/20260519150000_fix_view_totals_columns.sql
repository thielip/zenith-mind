-- 與程式一致：view 欄位名為 view_count（若舊版為 total_views 請執行本檔）
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
