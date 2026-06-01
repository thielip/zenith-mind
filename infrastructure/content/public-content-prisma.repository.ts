import type {
  AffiliateLinkRedirect,
  PublicContentRepository,
} from "@/domain/content/ports";
import { prisma } from "@/infrastructure/db/prisma";
import { mergePrismaPublishedWhere } from "@/lib/blog/public-post-visibility";
import { toPublicPostListItemDto } from "@/lib/dto/post-public.dto";

export const publicContentPrismaRepository: PublicContentRepository = {
  async searchPublishedPosts(query, locale) {
    const posts = await prisma.post.findMany({
      where: mergePrismaPublishedWhere({
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { titleEn: { contains: query, mode: "insensitive" } },
          { excerpt: { contains: query, mode: "insensitive" } },
          { excerptEn: { contains: query, mode: "insensitive" } },
        ],
      }),
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

    return posts.map((p) => toPublicPostListItemDto(p, locale));
  },

  async findActiveAffiliateLinkBySlug(slug) {
    const link = await prisma.affiliateLink.findFirst({
      where: { slug, isActive: true },
      select: { id: true, slug: true, targetUrl: true },
    });
    return link;
  },
};
