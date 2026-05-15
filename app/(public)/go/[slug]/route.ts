// app/(public)/go/[slug]/route.ts — Node Runtime
// 聯盟連結轉址（301 永久轉址 + 點擊計數非同步）

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { slug } = await params;

  const link = await prisma.affiliateLink.findUnique({
    where: { slug, isActive: true },
  });

  if (!link) {
    // 找不到或已停用 → 導回首頁
    return NextResponse.redirect(new URL("/", _req.url), { status: 302 });
  }

  // 非同步更新點擊數（不阻塞轉址）
  void prisma.affiliateLink.update({
    where: { id: link.id },
    data:  { clickCount: { increment: 1 } },
  }).catch((err: unknown) => {
    console.error("[AffiliateLink] click count update failed:", err);
  });

  // 301 永久轉址（瀏覽器快取，GA4 可追蹤）
  return NextResponse.redirect(link.targetUrl, { status: 301 });
}
