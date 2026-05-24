// 排程發文：將 scheduledAt 已到期的 SCHEDULED 文章改為 PUBLISHED

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/infrastructure/db/prisma";
import { purgePublicSiteAfterPostChange } from "@/lib/revalidate/purge-public-site";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env["CRON_SECRET"];
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET_REQUIRED" }, { status: 401 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(auth);
  const isValid =
    received.length === expected.length && timingSafeEqual(received, expected);
  if (!isValid) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      deletedAt: null,
      scheduledAt: { lte: now },
    },
    select: { id: true, slug: true, scheduledAt: true },
  });

  if (due.length === 0) {
    return NextResponse.json({ published: 0, slugs: [] });
  }

  const slugs: string[] = [];
  for (const post of due) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        publishedAt: post.scheduledAt ?? now,
        scheduledAt: null,
        updatedAt: now,
      },
    });
    slugs.push(post.slug);
    revalidatePath(`/zh-TW/blog/${post.slug}`);
    revalidatePath(`/en/blog/${post.slug}`);
    void purgePublicSiteAfterPostChange(post.slug);
  }

  revalidateTag("posts");
  revalidateTag("sitemap");
  revalidatePath("/sitemap.xml");
  revalidatePath("/zh-TW/blog");
  revalidatePath("/en/blog");

  logger.info("Scheduled posts published", { meta: { count: slugs.length, slugs } });

  return NextResponse.json({ published: slugs.length, slugs });
}
