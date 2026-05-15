// app/(public)/[locale]/blog/[slug]/page.tsx — 文章詳頁
// Cache 模式 A：revalidate=3600
// ✓ generateMetadata（含 OGP、Twitter Card、canonical）
// ✓ JSON-LD：Article + FAQPage + BreadcrumbList
// ✓ WCAG：語意 HTML、heading 層級、aria-*

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirectArchivedPostIfNeeded } from "@/lib/redirects/resolve";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { cache } from "react";
import { prisma } from "@/infrastructure/db/prisma";
import { env } from "@/env";
import {
  buildArticleSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
} from "@/lib/seo/schemas/article.schema";
import JsonLd    from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PostArticleBody from "@/components/blog/PostArticleBody";
import TableOfContents  from "@/components/blog/TableOfContents";
import RecommendedPosts from "@/components/blog/RecommendedPosts";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import { isDatabaseAvailable } from "@/lib/build/runtime-env";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const getPublishedPostBySlug = cache((slug: string) =>
  prisma.post.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: {
      author:   { select: { email: true } },
      category: { select: { id: true, name: true, nameEn: true, slug: true } },
      tags:     { include: { tag: { select: { name: true, slug: true } } } },
      seoMetadata: true,
      _count: { select: { pageViews: true } },
    },
  })
);

// ── ISR 預生成：最近 100 篇文章 ─────────────────────────

export async function generateStaticParams(): Promise<
  Array<{ locale: string; slug: string }>
> {
  // Cloudflare 建置若未注入 DATABASE_URL，略過預生成（首訪時 ISR 再產生）
  if (!isDatabaseAvailable()) return [];

  const posts = await prisma.post.findMany({
    where:   { status: "PUBLISHED", deletedAt: null },
    select:  { slug: true },
    orderBy: { publishedAt: "desc" },
    take:    100,
  });
  return ["zh-TW", "en"].flatMap((locale) =>
    posts.map((p) => ({ locale, slug: p.slug }))
  );
}

// ── generateMetadata ──────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const isEn = locale === "en";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  const title       = isEn ? (post.titleEn ?? post.title) : post.title;
  const description = isEn ? (post.excerptEn ?? "") : (post.excerpt ?? "");
  const metaTitle = isEn
    ? (post.seoMetadata?.metaTitleEn ?? post.titleEn ?? post.title)
    : (post.seoMetadata?.metaTitle ?? post.title);
  const metaDesc = isEn
    ? (post.seoMetadata?.metaDescriptionEn ?? post.excerptEn ?? "")
    : (post.seoMetadata?.metaDescription ?? post.excerpt ?? "");
  const ogTitle = post.seoMetadata?.ogTitle ?? metaTitle;
  const ogDesc = post.seoMetadata?.ogDescription ?? metaDesc;
  const canonical   = `${siteUrl}/${isEn ? "en" : "zh-TW"}/blog/${slug}`;

  const coverW = post.coverImageWidth ?? 1200;
  const coverH = post.coverImageHeight ?? 630;

  return {
    title:       metaTitle,
    description: metaDesc,
    alternates: {
      canonical,
      languages: {
        "zh-TW": `${siteUrl}/zh-TW/blog/${slug}`,
        en:      `${siteUrl}/en/blog/${slug}`,
      },
    },
    openGraph: {
      title:        ogTitle,
      description:  ogDesc,
      url:          canonical,
      type:         "article",
      locale:       isEn ? "en_US" : "zh_TW",
      alternateLocale: isEn ? ["zh_TW"] : ["en_US"],
      siteName:     "Zenith Mind",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime:  post.updatedAt.toISOString(),
      images: post.coverImage
        ? [
            {
              url: post.coverImage,
              alt: post.coverImageAlt ?? title,
              width: coverW,
              height: coverH,
            },
          ]
        : [],
    },
    twitter: {
      card:        "summary_large_image",
      title:       metaTitle,
      description: metaDesc,
      images:      post.coverImage
        ? [{ url: post.coverImage, alt: post.coverImageAlt ?? title, width: coverW, height: coverH }]
        : [],
    },
    robots: post.seoMetadata?.noIndex
      ? { index: false, follow: false }
      : { index: true,  follow: true  },
  };
}

// ── Page Component ────────────────────────────────────────

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const isEn   = locale === "en";
  const t      = await getTranslations("blog");
  const h      = await headers();
  const nonce  = h.get("x-nonce") ?? "";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    await redirectArchivedPostIfNeeded(locale, slug);
    notFound();
  }

  const title   = isEn ? (post.titleEn   ?? post.title)   : post.title;
  const content = isEn ? (post.contentEn ?? post.content) : post.content;
  const safeContent = typeof content === "string" ? content : "";
  const catName = isEn
    ? (post.category?.nameEn ?? post.category?.name)
    : post.category?.name;

  const canonical = `${siteUrl}/${isEn ? "en" : "zh-TW"}/blog/${slug}`;
  const blogBasePath = `/${isEn ? "en" : "zh-TW"}/blog`;

  // ── FAQ（從 Post.faq JSON 欄位讀取）─────────────────────
  const faqs = (post.faq as Array<{ question: string; questionEn?: string; answer: string; answerEn?: string }> | null) ?? [];

  // ── JSON-LD ───────────────────────────────────────────────
  const articleSchema = buildArticleSchema({
    title,
    description: (isEn ? post.excerptEn : post.excerpt) ?? "",
    url:         canonical,
    imageUrl:    post.coverImage ?? undefined,
    authorName:  "巔峰思維",
    publishedAt: post.publishedAt ?? post.createdAt,
    updatedAt:   post.updatedAt,
  });

  const faqSchema = faqs.length > 0
    ? buildFaqSchema(
        faqs.map((f) => ({
          question: isEn ? (f.questionEn ?? f.question) : f.question,
          answer:   isEn ? (f.answerEn   ?? f.answer)   : f.answer,
        }))
      )
    : null;

  const breadcrumbItems = [
    { name: isEn ? "Home"     : "首頁", url: `${siteUrl}/${isEn ? "en" : "zh-TW"}` },
    { name: isEn ? "Blog"     : "文章", url: `${siteUrl}/${isEn ? "en" : "zh-TW"}/blog` },
    ...(post.category
      ? [{ name: catName ?? "", url: `${siteUrl}/${isEn ? "en" : "zh-TW"}/blog?category=${post.category.slug}` }]
      : []),
    { name: title, url: canonical },
  ];

  return (
    <>
      <JsonLd data={articleSchema} nonce={nonce} />
      {faqSchema && <JsonLd data={faqSchema} nonce={nonce} />}
      <JsonLd data={buildBreadcrumbSchema(breadcrumbItems)} nonce={nonce} />
      <PageViewTracker postId={post.id} locale={locale} />

      <article
        className="mx-auto max-w-4xl px-4 py-10"
        aria-labelledby="article-title"
      >
        <div className="mb-8 rounded-xl border border-gray-200/80 bg-gray-50/90 px-4 py-3">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* 文章標頭 */}
        <header className="mb-8">
          {catName && (
            <Link
              href={`${blogBasePath}?category=${post.category?.slug}`}
              className="text-sm font-semibold uppercase tracking-wide text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {catName}
            </Link>
          )}
          <h1
            id="article-title"
            className="mt-2 text-4xl font-bold leading-[1.15] tracking-tight text-gray-900 sm:text-5xl lg:text-[2.75rem]"
          >
            {title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
            <time dateTime={post.publishedAt?.toISOString()}>
              {post.publishedAt?.toLocaleDateString(isEn ? "en-US" : "zh-TW")}
            </time>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5" aria-label={`${t("readingTime")} ${post.readingTime} ${t("minutes")}`}>
              <Clock size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
              <span>
                {post.readingTime} {t("minutes")}
              </span>
            </span>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span>
              {post._count.pageViews.toLocaleString()} {isEn ? "views" : "次瀏覽"}
            </span>
          </div>
          {post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2" aria-label={t("tags")}>
              {post.tags.map(({ tag }) => (
                <Link
                  key={tag.slug}
                  href={`${blogBasePath}?tag=${tag.slug}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* 封面圖（LCP 關鍵路徑，不 lazy load）*/}
        {post.coverImage && (
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt ?? title}
            width={post.coverImageWidth ?? 896}
            height={post.coverImageHeight ?? 504}
            className="mb-8 w-full rounded-xl object-cover"
            priority
          />
        )}

        <div className="flex gap-10">
          {/* 文章主體 */}
          <div className="min-w-0 flex-1">
            <PostArticleBody
              locale={locale}
              content={safeContent}
              contentType={post.contentType}
              contentBlocks={post.contentBlocks}
            />

            {/* FAQ 區塊 */}
            {faqs.length > 0 && (
              <section
                aria-labelledby="faq-heading"
                className="mt-14 border-t pt-10"
              >
                <h2
                  id="faq-heading"
                  className="mb-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
                >
                  {isEn ? "Frequently Asked Questions" : "常見問題"}
                </h2>
                <dl className="space-y-6">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-6"
                    >
                      <dt className="font-semibold text-gray-900">
                        {isEn ? (faq.questionEn ?? faq.question) : faq.question}
                      </dt>
                      <dd className="mt-2 text-gray-600 leading-relaxed">
                        {isEn ? (faq.answerEn ?? faq.answer) : faq.answer}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>

          {/* 目錄（桌面端側欄）*/}
          <aside
            className="hidden w-60 shrink-0 xl:block"
            aria-label={isEn ? "Table of Contents" : "文章目錄"}
          >
            <div className="sticky top-8">
              <TableOfContents content={safeContent} />
            </div>
          </aside>
        </div>

        {/* 相關文章 */}
        <RecommendedPosts
          currentPostId={post.id}
          categoryId={post.categoryId ?? undefined}
          locale={locale}
        />
      </article>
    </>
  );
}
