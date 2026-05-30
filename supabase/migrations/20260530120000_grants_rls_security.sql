-- Supabase 新安全規範：明確 GRANT + ENABLE RLS + POLICY
-- 執行後：NOTIFY pgrst 重新載入 schema cache

-- ── 1. service_role 維持 BYPASSRLS ─────────────────────────────────────
ALTER ROLE service_role WITH BYPASSRLS;

GRANT USAGE ON SCHEMA public TO service_role, anon, authenticated, authenticator;

-- ── 2. 補齊 Prisma 遷移後建立、尚未明確授權的表 ───────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_credentials TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_link_click_daily TO service_role;
GRANT SELECT ON public.redirects TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tags TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_metadata TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_carousel_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_slots TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_links TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_views TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_aggregates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_daily_aggregates TO service_role;

GRANT SELECT ON public.v_post_view_totals TO service_role, anon, authenticated;
GRANT SELECT ON public.v_site_view_totals TO service_role, anon, authenticated;

REVOKE ALL ON FUNCTION public.refresh_page_view_daily_aggregates(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_page_view_daily_aggregates(DATE) TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- ── 3. 全表啟用 RLS ───────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_link_click_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

-- ── 4. 公開讀取 POLICY（anon / authenticated）────────────────────────
DROP POLICY IF EXISTS "public_read_published_posts" ON public.posts;
CREATE POLICY "public_read_published_posts"
  ON public.posts FOR SELECT
  TO anon, authenticated
  USING (status::text = 'PUBLISHED' AND "deletedAt" IS NULL);

DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING ("deletedAt" IS NULL);

DROP POLICY IF EXISTS "public_read_tags" ON public.tags;
CREATE POLICY "public_read_tags"
  ON public.tags FOR SELECT
  TO anon, authenticated
  USING ("deletedAt" IS NULL);

DROP POLICY IF EXISTS "public_read_post_tags" ON public.post_tags;
CREATE POLICY "public_read_post_tags"
  ON public.post_tags FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_tags."postId"
        AND p.status::text = 'PUBLISHED'
        AND p."deletedAt" IS NULL
    )
  );

DROP POLICY IF EXISTS "public_read_seo_metadata" ON public.seo_metadata;
CREATE POLICY "public_read_seo_metadata"
  ON public.seo_metadata FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = seo_metadata."postId"
        AND p.status::text = 'PUBLISHED'
        AND p."deletedAt" IS NULL
    )
  );

DROP POLICY IF EXISTS "public_read_ad_slots" ON public.ad_slots;
CREATE POLICY "public_read_ad_slots"
  ON public.ad_slots FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "public_read_affiliate_links" ON public.affiliate_links;
CREATE POLICY "public_read_affiliate_links"
  ON public.affiliate_links FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "public_read_hero_slides" ON public.hero_slides;
CREATE POLICY "public_read_hero_slides"
  ON public.hero_slides FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "public_read_home_carousel_items" ON public.home_carousel_items;
CREATE POLICY "public_read_home_carousel_items"
  ON public.home_carousel_items FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "public_read_site_settings" ON public.site_settings;
CREATE POLICY "public_read_site_settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (id = 'site');

-- Tier B/C：page_views、redirects、aggregates、後台表 — 無 anon policy（deny-by-default）
-- service_role 以 BYPASSRLS 存取

-- ── 5. 撤銷過寬的 anon SELECT，改表級授權 ─────────────────────────────
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

GRANT SELECT ON public.posts TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT SELECT ON public.post_tags TO anon, authenticated;
GRANT SELECT ON public.seo_metadata TO anon, authenticated;
GRANT SELECT ON public.ad_slots TO anon, authenticated;
GRANT SELECT ON public.affiliate_links TO anon, authenticated;
GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT SELECT ON public.home_carousel_items TO anon, authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;

-- 密碼雜湊僅 service_role（Prisma / Worker 密碼驗證）
REVOKE SELECT ("accessPasswordHash") ON public.posts FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
