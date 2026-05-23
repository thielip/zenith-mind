// app/(public)/go/[slug]/route.ts
// 聯盟連結轉址（301）+ 點擊計數（Vercel Prisma；CF 僅轉址）

import { NextRequest, NextResponse } from "next/server";
import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";
import { getPublicContentRepository } from "@/lib/public-content/get-repository";
import { recordAffiliateClick } from "@/lib/affiliate/record-click";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { slug } = await params;

  try {
    const repo = await getPublicContentRepository();
    const link = await repo.findActiveAffiliateLinkBySlug(slug);

    if (!link) {
      return NextResponse.redirect(new URL("/", _req.url), { status: 302 });
    }

    if (!isCfPublicRuntime()) {
      void recordAffiliateClick(link.id).catch((err: unknown) => {
        console.error("[AffiliateLink] click count update failed:", err);
      });
    }

    return NextResponse.redirect(link.targetUrl, { status: 301 });
  } catch (e: unknown) {
    console.error("[go] redirect error:", e);
    return NextResponse.redirect(new URL("/", _req.url), { status: 302 });
  }
}
