import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

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

const queries = [
  {
    name: "featured",
    select:
      "id,slug,title,titleEn,excerpt,excerptEn,publishedAt,readingTime,categories(name,nameEn,slug)",
  },
  {
    name: "blog-list",
    select:
      "id,slug,title,titleEn,excerpt,excerptEn,publishedAt,readingTime,coverImage,coverImageAlt,categories(name,nameEn,slug)",
  },
];

for (const q of queries) {
  const url = new URL(`${base.replace(/\/$/, "")}/rest/v1/posts`);
  url.searchParams.set("select", q.select);
  url.searchParams.set("status", "eq.PUBLISHED");
  url.searchParams.set("deletedAt", "is.null");
  url.searchParams.set("order", "publishedAt.desc,createdAt.desc");
  url.searchParams.set("limit", "3");

  const res = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  console.log(`\n[${q.name}] ${res.status}`);
  console.log(text.slice(0, 400));
}

for (const label of ["DIRECT_URL", "DATABASE_URL"]) {
  const url = env[label];
  if (!url) continue;
  try {
    const sql = neon(url);
    const rows = await sql.query(
      `SELECT id, slug, title FROM posts
       WHERE status::text = 'PUBLISHED' AND "deletedAt" IS NULL
       ORDER BY "publishedAt" DESC NULLS LAST LIMIT 3`,
      []
    );
    console.log(`\n[neon-sql ${label}] ok`, rows.length, rows[0]?.slug);
  } catch (e) {
    console.log(`\n[neon-sql ${label}] error`, e.message);
  }
}
