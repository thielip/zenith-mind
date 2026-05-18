import { readFileSync } from "node:fs";

function loadDevVars() {
  const out = {};
  for (const line of readFileSync(".dev.vars", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

const env = loadDevVars();
const base = env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qhutexisyfbclxntgkvx.supabase.co";
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .dev.vars");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Accept: "application/json",
  "Accept-Profile": "public",
  "Content-Profile": "public",
};

const queries = [
  {
    name: "featured",
    table: "posts",
    select:
      "id,slug,title,titleEn,excerpt,excerptEn,publishedAt,readingTime,categories(name,nameEn,slug)",
  },
  {
    name: "view-totals",
    table: "v_post_view_totals",
    select: "post_id,view_count",
    extra: { limit: "3" },
  },
];

for (const q of queries) {
  const url = new URL(`${base.replace(/\/$/, "")}/rest/v1/${q.table}`);
  url.searchParams.set("select", q.select);
  if (q.table === "posts") {
    url.searchParams.set("status", "eq.PUBLISHED");
    url.searchParams.set("deletedAt", "is.null");
    url.searchParams.set("order", "publishedAt.desc,createdAt.desc");
  }
  if (q.extra) {
    for (const [k, v] of Object.entries(q.extra)) url.searchParams.set(k, v);
  }

  const res = await fetch(url, { headers });
  const text = await res.text();
  console.log(`\n[${q.name}] ${res.status}`);
  console.log(text.slice(0, 400));
}

console.log(
  "\nNote: wrangler secret put only updates Cloudflare Worker. Sync .dev.vars for local tests."
);
