import { prisma } from "@/infrastructure/db/prisma";

export interface PostFaqStats {
  publishedTotal: number;
  withFaqCount: number;
  faqCoveragePct: number;
  withSeoMetadataCount: number;
  seoMetadataCoveragePct: number;
}

function hasValidFaq(faq: unknown): boolean {
  if (!Array.isArray(faq) || faq.length === 0) return false;
  return faq.some((item) => {
    if (typeof item !== "object" || item === null) return false;
    const row = item as { question?: string; answer?: string };
    return Boolean(row.question?.trim() && row.answer?.trim());
  });
}

/** 已發布文章中，具 FAQ 結構化資料（Post.faq JSON）的比例 */
export async function getPublishedPostFaqStats(): Promise<PostFaqStats> {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { faq: true, seoMetadata: { select: { id: true } } },
  });

  const publishedTotal = posts.length;
  const withFaqCount = posts.filter((p) => hasValidFaq(p.faq)).length;
  const withSeoMetadataCount = posts.filter((p) => p.seoMetadata != null).length;

  const faqCoveragePct =
    publishedTotal === 0 ? 0 : Math.round((withFaqCount / publishedTotal) * 100);
  const seoMetadataCoveragePct =
    publishedTotal === 0
      ? 0
      : Math.round((withSeoMetadataCount / publishedTotal) * 100);

  return {
    publishedTotal,
    withFaqCount,
    faqCoveragePct,
    withSeoMetadataCount,
    seoMetadataCoveragePct,
  };
}
