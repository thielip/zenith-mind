// app/(public)/[locale]/about/page.tsx — 關於頁
// Cache 模式 A：revalidate=86400（每天更新）

import type { Metadata } from "next";
import { env } from "@/env";
import { getSafeSiteSettings } from "@/lib/site/safe-site-settings";

export const revalidate = 86400;

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  return {
    title: isEn ? "About" : "關於我",
    description: isEn
      ? "Learn more about Zenith Mind and the creator behind it."
      : "了解巔峰思維和創作者的故事。",
    alternates: {
      canonical: isEn ? `${siteUrl}/en/about` : `${siteUrl}/zh-TW/about`,
      languages: {
        "zh-TW": `${siteUrl}/zh-TW/about`,
        en: `${siteUrl}/en/about`,
      },
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const isEn = locale === "en";
  const siteSettings = await getSafeSiteSettings();
  const sections = siteSettings.aboutSections;
  const heading = isEn
    ? (sections[0]?.titleEn || "About Zenith Mind")
    : (sections[0]?.title || "關於巔峰思維");

  return (
    <>
      <article
        className="mx-auto max-w-3xl px-4 py-16"
        aria-labelledby="about-heading"
      >
        <h1
          id="about-heading"
          className="mb-6 text-3xl font-bold text-gray-900"
        >
          {heading}
        </h1>

        <div className="prose prose-gray max-w-none">
          {sections.map((section, index) => {
            const title = isEn ? (section.titleEn || section.title) : section.title;
            const body = isEn ? (section.bodyEn || section.body) : section.body;
            return (
              <section key={section.id}>
                {index > 0 && title && <h2>{title}</h2>}
                {body.split("\n").filter(Boolean).map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex}>{paragraph}</p>
                ))}
              </section>
            );
          })}
        </div>
      </article>
    </>
  );
}
