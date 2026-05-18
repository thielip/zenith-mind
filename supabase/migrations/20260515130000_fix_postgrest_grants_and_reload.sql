-- 修復 PostgREST 403 + 讓新建的 View 出現在 schema cache
-- 在 Supabase SQL Editor 執行（migration 已成功後若 REST 仍 403/404 請跑此檔）

-- 1) 確保 service_role 具備 BYPASSRLS 與 public schema 權限
ALTER ROLE service_role WITH BYPASSRLS;

GRANT USAGE ON SCHEMA public TO service_role, anon, authenticated, authenticator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 2) 新物件明確授權（避免 ALL TABLES 在建立前已執行過）
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tags TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_views TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_aggregates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_daily_aggregates TO service_role;

GRANT SELECT ON public.v_post_view_totals TO service_role, anon, authenticated;
GRANT SELECT ON public.v_site_view_totals TO service_role, anon, authenticated;

-- 3) PostgREST 重新載入 schema（修復 v_post_view_totals 404 PGRST205）
NOTIFY pgrst, 'reload schema';
