// lib/seo/schemas/article.schema.ts
// JSON-LD Schema 產生函式（統一管理，page.tsx import 使用）

import { toIsoStringSafe } from "@/lib/blog/safe-blog-dates";
import { absoluteSiteLogoUrl } from "@/lib/site/brand";
import { getPublicSiteUrl } from "@/lib/site/url";

const BRAND_ZH = "巔峰思維";
const BRAND_EN = "Zenith Mind";

// ── Article ────────────────────────────────────────────────

export function buildArticleSchema(p: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  authorName: string;
  publishedAt: Date;
  updatedAt: Date;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    url: p.url,
    image: p.imageUrl ? { "@type": "ImageObject", url: p.imageUrl } : undefined,
    author: { "@type": "Person", name: p.authorName },
    publisher: {
      "@type": "Organization",
      name: BRAND_ZH,
      logo: { "@type": "ImageObject", url: absoluteSiteLogoUrl(getPublicSiteUrl()) },
    },
    datePublished: toIsoStringSafe(p.publishedAt),
    dateModified: toIsoStringSafe(p.updatedAt),
    mainEntityOfPage: { "@type": "WebPage", "@id": p.url },
  };
}

// ── FAQPage ────────────────────────────────────────────────

export function buildFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

// ── BreadcrumbList ─────────────────────────────────────────

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ── Organization + WebSite（首頁）────────────────────────

export function buildHomeWebPageSchema(p: {
  locale: "zh-TW" | "en";
  title: string;
  description: string;
}) {
  const base = getPublicSiteUrl();
  const path = p.locale === "en" ? "/en" : "/zh-TW";
  const url = `${base}${path}`;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: p.title,
    description: p.description,
    isPartOf: { "@id": `${base}/#website` },
    about: { "@id": `${base}/#organization` },
    inLanguage: p.locale === "en" ? "en" : "zh-TW",
  };
}

export function buildBlogCollectionSchema(p: {
  locale: "zh-TW" | "en";
  name: string;
  description: string;
  postUrls: string[];
}) {
  const base = getPublicSiteUrl();
  const path = p.locale === "en" ? "/en/blog" : "/zh-TW/blog";

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${base}${path}#collection`,
    url: `${base}${path}`,
    name: p.name,
    description: p.description,
    isPartOf: { "@id": `${base}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: p.postUrls.slice(0, 12).map((itemUrl, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: itemUrl,
      })),
    },
  };
}

export function buildOrganizationSchema() {
  const base = getPublicSiteUrl();
  const logo = absoluteSiteLogoUrl(base);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: BRAND_ZH,
        alternateName: BRAND_EN,
        url: base,
        logo: { "@type": "ImageObject", url: logo },
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: BRAND_ZH,
        publisher: { "@id": `${base}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${base}/zh-TW/blog?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}
