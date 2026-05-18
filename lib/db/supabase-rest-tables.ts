// lib/db/supabase-rest-tables.ts — PostgREST 表名白名單（防路徑操縱）

const ALLOWED_TABLES = new Set([
  "posts",
  "categories",
  "tags",
  "post_tags",
  "seo_metadata",
  "hero_slides",
  "site_settings",
  "home_carousel_items",
  "ad_slots",
  "affiliate_links",
  "redirects",
  "v_post_view_totals",
  "v_site_view_totals",
]);

export function assertAllowedSupabaseTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Supabase REST table not allowed: ${table}`);
  }
}
