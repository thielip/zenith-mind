// app/api/search/route.ts — 公開文章搜尋（PostgreSQL ILIKE MVP）
// CF：Supabase REST；Vercel：Prisma（PublicContentRepository）

import { NextResponse } from "next/server";
import { getPublicContentRepository } from "@/lib/public-content/get-repository";
import {
  enforceRateLimitResponse,
  PUBLIC_API_RATE_LIMITS,
} from "@/lib/security/enforce-rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limited = await enforceRateLimitResponse(
    req.headers,
    "public:search",
    PUBLIC_API_RATE_LIMITS.search.limit,
    PUBLIC_API_RATE_LIMITS.search.windowSec
  );
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const localeRaw = searchParams.get("locale") ?? "zh-TW";
  const locale = localeRaw === "en" ? "en" : "zh-TW";

  if (q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters", items: [] },
      { status: 400 }
    );
  }

  try {
    const repo = await getPublicContentRepository();
    const items = await repo.searchPublishedPosts(q, locale);
    return NextResponse.json({ query: q, locale, items });
  } catch (e: unknown) {
    console.error("[search] error:", e);
    return NextResponse.json(
      { error: "SEARCH_UNAVAILABLE", items: [] },
      { status: 503 }
    );
  }
}
