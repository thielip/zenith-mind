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
const base = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" };
const slug = process.argv[2] ?? "post-mp4839gz";

const core =
  "id,slug,title,content,categories(id,name,nameEn,slug),coverImage,coverImageAlt";
const url = `${base}/rest/v1/posts?select=${encodeURIComponent(core)}&slug=eq.${slug}&status=eq.PUBLISHED&deletedAt=is.null&limit=1`;
const res = await fetch(url, { headers });
const text = await res.text();
console.log(`[post core] ${res.status}`);
console.log(text.slice(0, 280));
