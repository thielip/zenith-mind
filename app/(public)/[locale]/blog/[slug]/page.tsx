// app/(public)/[locale]/blog/[slug]/page.tsx — 文章詳頁
// Cache 模式 A：revalidate=3600
// CF Worker：Supabase REST（見 lib/blog/load-blog-post-data.ts）

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirectArchivedPostIfNeeded } from "@/lib/redirects/resolve";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";
import ResponsiveImage from "@/components/ui/ResponsiveImage";
import { Clock } from "lucide-react";
import { env } from "@/env";
import {
  loadBlogPostBySlug,
  loadPublishedPostSlugsForStaticParams,
} from "@/lib/blog/load-blog-post-data";
import {
  buildArticleSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
} from "@/lib/seo/schemas/article.schema";
import JsonLd    from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PostArticleBody from "@/components/blog/PostArticleBody";
import TableOfContents  from "@/components/blog/TableOfContents";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import { hasPostAccess } from "@/lib/blog/post-access-cookie";
import { isCfPublicRuntime } from "@/lib/db/cf-public-runtime";

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

// ── ISR 預生成：最近 100 篇文章 ─────────────────────────

export async function generateStaticParams(): Promise<
  Array<{ locale: string; slug: string }>
> {
  const slugs = await loadPublishedPostSlugsForStaticParams(100);
  return ["zh-TW", "en"].flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug }))
  );
}

// ── generateMetadata ──────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const isEn = locale === "en";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  const post = await loadBlogPostBySlug(slug);
  if (!post) return {};

  const title       = isEn ? (post.titleEn ?? post.title) : post.title;
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

  const post = await loadBlogPostBySlug(slug);
  if (!post) {
    await redirectArchivedPostIfNeeded(locale, slug);
    notFound();
  }

  const title   = isEn ? (post.titleEn   ?? post.title)   : post.title;
  const unlocked =
    !post.isPasswordProtected || (await hasPostAccess(slug, post.id));
  const rawContent = isEn ? (post.contentEn ?? post.content) : post.content;
  const safeContent =
    unlocked && typeof rawContent === "string" ? rawContent : "";
  const catName = isEn
    ? (post.category?.nameEn ?? post.category?.name)
    : post.category?.name;

  const canonical = `${siteUrl}/${isEn ? "en" : "zh-TW"}/blog/${slug}`;
  const blogBasePath = `/${isEn ? "en" : "zh-TW"}/blog`;

  const faqs = post.faq ?? [];

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

  const publishedIso =
    post.publishedAt && !Number.isNaN(post.publishedAt.getTime())
      ? post.publishedAt.toISOString()
      : undefined;

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
            <time dateTime={publishedIso}>
              {publishedIso
                ? post.publishedAt?.toLocaleDateString(isEn ? "en-US" : "zh-TW")
                : null}
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

        {post.coverImage && (
          <ResponsiveImage
            src={post.coverImage}
            alt={post.coverImageAlt ?? title}
            width={post.coverImageWidth ?? 896}
            height={post.coverImageHeight ?? 504}
            className="mb-8 w-full rounded-xl object-cover"
            priority
          />
        )}

        <div className="flex gap-10">
          <div className="min-w-0 flex-1">
            {PasswordGate ? (
              <PasswordGate slug={slug} locale={locale} />
            ) : (
              <PostArticleBody
                locale={locale}
                content={safeContent}
                contentType={post.contentType}
                contentBlocks={post.contentBlocks}
              />
            )}

            {unlocked && faqs.length > 0 && (
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

          {!cfLight && (
            <aside
              className="hidden w-60 shrink-0 xl:block"
              aria-label={isEn ? "Table of Contents" : "文章目錄"}
            >
              <div className="sticky top-8">
                <TableOfContents content={safeContent} />
              </div>
            </aside>
          )}
        </div>

        {RecommendedPostsSection ? (
          <RecommendedPostsSection
            currentPostId={post.id}
            categoryId={post.categoryId ?? undefined}
            locale={locale}
          />
        ) : null}
      </article>
    </>
  );
}
