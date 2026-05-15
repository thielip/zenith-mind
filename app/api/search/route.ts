// app/api/search/route.ts — 公開文章搜尋（PostgreSQL ILIKE MVP）
// 未來可改接 Algolia / OpenSearch，維持 DTO 輸出穩定

import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { toPublicPostListItemDto } from "@/lib/dto/post-public.dto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { titleEn: { contains: q, mode: "insensitive" } },
        { excerpt: { contains: q, mode: "insensitive" } },
        { excerptEn: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      titleEn: true,
      excerpt: true,
      excerptEn: true,
      publishedAt: true,
      readingTime: true,
      category: { select: { slug: true, name: true, nameEn: true } },
    },
    orderBy: [{ publishedAt: "desc" }],
    take: 30,
  });

  const items = posts.map((p) => toPublicPostListItemDto(p, locale));

  return NextResponse.json({ query: q, locale, items });
}
