// lib/seo/schemas/article.schema.ts
// JSON-LD Schema 產生函式（統一管理，page.tsx import 使用）

import { env } from "@/env";

const SITE_URL  = env.NEXT_PUBLIC_SITE_URL;
const BRAND_ZH  = "巔峰思維";
const BRAND_EN  = "Zenith Mind";

// ── Article ────────────────────────────────────────────────

export function buildArticleSchema(p: {
  title:       string;
  description: string;
  url:         string;
  imageUrl?:   string;
  authorName:  string;
  publishedAt: Date;
  updatedAt:   Date;
}) {
  return {
    "@context": "https://schema.org",
    "@type":    "Article",
    headline:         p.title,
    description:      p.description,
    url:              p.url,
    image:            p.imageUrl ? { "@type": "ImageObject", url: p.imageUrl } : undefined,
    author:           { "@type": "Person", name: p.authorName },
    publisher: {
      "@type": "Organization",
      name:    BRAND_ZH,
      logo:    { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    datePublished:    p.publishedAt.toISOString(),
    dateModified:     p.updatedAt.toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": p.url },
  };
}

// ── FAQPage ────────────────────────────────────────────────

export function buildFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context":  "https://schema.org",
    "@type":     "FAQPage",
    mainEntity:  faqs.map((f) => ({
      "@type": "Question",
      name:    f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

// ── BreadcrumbList ─────────────────────────────────────────

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context":      "https://schema.org",
    "@type":         "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type":    "ListItem",
      position:   i + 1,
      name:       item.name,
      item:       item.url,
    })),
  };
}

// ── Organization + WebSite（首頁）────────────────────────

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type":       "Organization",
        "@id":         `${SITE_URL}/#organization`,
        name:          BRAND_ZH,
        alternateName: BRAND_EN,
        url:           SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
      },
      {
        "@type":     "WebSite",
        "@id":       `${SITE_URL}/#website`,
        url:         SITE_URL,
        name:        BRAND_ZH,
        publisher:   { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type":       "SearchAction",
          target:        { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/zh-TW/blog?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}
