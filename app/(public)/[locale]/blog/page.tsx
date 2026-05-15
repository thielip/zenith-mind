// app/(public)/[locale]/blog/page.tsx — 文章列表
// Cache 模式 A：revalidate=3600

import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { prisma } from "@/infrastructure/db/prisma";
import { env } from "@/env";
import BlogSearchFilters from "@/components/blog/BlogSearchFilters";
import { sortDefaultCategories } from "@/lib/categories/defaults";

export const revalidate = 3600;

interface Props {
  params:      Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string }>;
}

const PER_PAGE = 12;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  return {
    title: isEn ? "Blog" : "精選文章",
    description: isEn
      ? "Featured articles on AI, investing, and personal branding."
      : "精選文章：AI 工具、投資理財、個人品牌與內容策略。",
    alternates: {
      canonical: `${siteUrl}/${isEn ? "en" : "zh-TW"}/blog`,
      languages: {
        "zh-TW": `${siteUrl}/zh-TW/blog`,
        en:      `${siteUrl}/en/blog`,
      },
    },
  };
}

export default async function BlogListPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp    = await searchParams;
  const isEn  = locale === "en";
  const page  = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip  = (page - 1) * PER_PAGE;
  const t     = await getTranslations("blog");
  const query = (sp.q ?? "").trim();
  const basePath   = `/${isEn ? "en" : "zh-TW"}/blog`;

  // 分類篩選
  const where: Prisma.PostWhereInput = {
    status:    "PUBLISHED" as const,
    deletedAt: null,
    ...(sp.category ? { category: { slug: sp.category } } : {}),
    ...(sp.tag      ? { tags: { some: { tag: { slug: sp.tag } } } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { titleEn: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
            { excerptEn: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [posts, total, categories, tags] = await Promise.all([
    prisma.post.findMany({
      where,
      select: {
        id: true, slug: true, title: true, titleEn: true,
        excerpt: true, excerptEn: true, coverImage: true,
        coverImageAlt: true, publishedAt: true, readingTime: true,
        _count: { select: { pageViews: true } },
        category: { select: { name: true, nameEn: true, slug: true } },
        tags: {
          take: 3,
          include: { tag: { select: { name: true, nameEn: true, slug: true } } },
        },
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take:    PER_PAGE,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({
      where:   { deletedAt: null },
      select:  { slug: true, name: true, nameEn: true },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      where: { deletedAt: null },
      select: { slug: true, name: true, nameEn: true },
      orderBy: { posts: { _count: "desc" } },
      take: 18,
    }),
  ]);

  const sortedCategories = sortDefaultCategories(categories);

  const totalPages = Math.ceil(total / PER_PAGE);
  function buildPageHref(nextPage: number) {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    if (sp.category) params.set("category", sp.category);
    if (sp.tag) params.set("tag", sp.tag);
    if (query) params.set("q", query);
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {isEn ? "Featured articles" : "精選文章"}
      </h1>

      <BlogSearchFilters
        locale={locale}
        basePath={basePath}
        query={query}
        category={sp.category}
        activeTag={sp.tag}
        tags={tags}
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 主內容 */}
        <main className="min-w-0 flex-1" id="post-list">
          {posts.length === 0 ? (
            <p className="text-gray-500">
              {isEn ? "No featured articles found." : "目前沒有精選文章。"}
            </p>
          ) : (
            <ol className="space-y-8" aria-label={isEn ? "Featured article list" : "精選文章列表"}>
              {posts.map((post) => {
                const title   = isEn ? (post.titleEn ?? post.title) : post.title;
                const excerpt = isEn ? post.excerptEn : post.excerpt;
                const catName = isEn
                  ? (post.category?.nameEn ?? post.category?.name)
                  : post.category?.name;

                return (
                  <li key={post.id}>
                    <article className="flex gap-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
                      {post.coverImage && (
                        <Link
                          href={`${basePath}/${post.slug}`}
                          className="hidden shrink-0 sm:block"
                          aria-hidden="true"
                          tabIndex={-1}
                        >
                          <Image
                            src={post.coverImage}
                            alt={post.coverImageAlt ?? title}
                            width={200}
                            height={130}
                            className="h-32 w-48 rounded-lg object-cover"
                          />
                        </Link>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        {catName && (
                          <Link
                            href={`${basePath}?category=${post.category?.slug}`}
                            className="text-xs font-medium uppercase tracking-wide text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {catName}
                          </Link>
                        )}
                        <h2 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">
                          <Link
                            href={`${basePath}/${post.slug}`}
                            className="hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {title}
                          </Link>
                        </h2>
                        <p className="mt-2 min-h-[4.5rem] text-sm leading-6 text-gray-600 line-clamp-3">
                          {excerpt?.trim() ? excerpt : "\u00a0"}
                        </p>
                        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3 text-xs text-gray-600">
                          <time dateTime={post.publishedAt?.toISOString()}>
                            {post.publishedAt?.toLocaleDateString(
                              isEn ? "en-US" : "zh-TW"
                            )}
                          </time>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
                            <span>
                              {post.readingTime} {t("minutes")}
                            </span>
                          </span>
                          <span>·</span>
                          <span>
                            {post._count.pageViews.toLocaleString()} {isEn ? "views" : "次瀏覽"}
                          </span>
                          {post.tags.length > 0 && (
                            <div className="flex gap-1" aria-label={t("tags")}>
                              {post.tags.map(({ tag }) => (
                                <Link
                                  key={tag.slug}
                                  href={`${basePath}?tag=${tag.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                                  className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-500 hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  {tag.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}

          {/* 分頁 */}
          {totalPages > 1 && (
            <nav
              aria-label={isEn ? "Pagination" : "分頁導覽"}
              className="mt-12 flex justify-center gap-2"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildPageHref(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    p === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </main>

        {/* 側邊欄：分類篩選 */}
        <aside
          className="w-full shrink-0 lg:w-56"
          aria-label={isEn ? "Filter by category" : "依分類篩選"}
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {isEn ? "Categories" : "分類"}
          </h2>
          <ul className="space-y-1">
            <li>
              <Link
                href={basePath}
                aria-current={!sp.category ? "page" : undefined}
                className={[
                  "block rounded-md px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  !sp.category
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                {isEn ? "All" : "全部"}
              </Link>
            </li>
            {sortedCategories.map((cat) => {
              const catName = isEn ? (cat.nameEn ?? cat.name) : cat.name;
              const isActive = sp.category === cat.slug;
              return (
                <li key={cat.slug}>
                  <Link
                    href={`${basePath}?category=${cat.slug}`}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "block rounded-md px-3 py-2 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      isActive
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-gray-600 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {catName}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
