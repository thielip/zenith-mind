import "dotenv/config";

const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" };

async function q(label, path) {
  const r = await fetch(`${base}${path}`, { headers: h });
  const text = await r.text();
  console.log(`\n── ${label} (${r.status}) ──`);
  console.log(text.slice(0, 800));
}

await q("v_site_view_totals *", "/rest/v1/v_site_view_totals?select=*&limit=5");
await q("v_site_view_totals zh-TW", "/rest/v1/v_site_view_totals?select=*&locale=eq.zh-TW&limit=1");
await q("site_daily_aggregates", "/rest/v1/site_daily_aggregates?select=*&limit=3");
await q("page_views count", "/rest/v1/page_views?select=id&postId=is.null&locale=eq.zh-TW&limit=1");
await q("v_post_view_totals", "/rest/v1/v_post_view_totals?select=*&limit=3");
await q("distinct locales home", "/rest/v1/page_views?select=locale&postId=is.null&limit=5");
await q(
  "post totals with total_views col",
  "/rest/v1/v_post_view_totals?select=post_id,view_count,total_views&limit=1"
);
