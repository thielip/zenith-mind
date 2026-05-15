import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { HomepageCopy } from "@/lib/site/types";

interface Props {
  locale: string;
  copy: HomepageCopy["conversionBanner"];
}

export default function HomeConversionBanner({ locale, copy }: Props) {
  const isEn = locale === "en";
  const prefix = isEn ? "/en" : "/zh-TW";
  const title = isEn ? copy.titleEn : copy.title;
  if (!title.trim()) return null;

  const eyebrow = isEn ? copy.eyebrowEn : copy.eyebrow;
  const description = isEn ? copy.descriptionEn : copy.description;
  const ctaLabel = isEn ? copy.ctaLabelEn : copy.ctaLabel;
  const rawHref = copy.ctaHref.trim() || "#affiliate-links";
  const ctaHref = rawHref.startsWith("#") ? `${prefix}/${rawHref}` : rawHref;

  return (
    <section
      id="conversion-banner"
      className="border-y border-blue-100 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 py-14 text-white"
      aria-labelledby="conversion-banner-heading"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/90">
            <Sparkles size={14} className="shrink-0 text-amber-300" aria-hidden="true" />
            {eyebrow}
          </p>
          <h2 id="conversion-banner-heading" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {title}
          </h2>
          {description.trim() && (
            <p className="mt-4 text-sm leading-7 text-blue-100/90 sm:text-base">{description}</p>
          )}
        </div>
        {ctaLabel.trim() && (
          <div className="shrink-0">
            <Link
              href={ctaHref}
              className="inline-flex min-w-[12rem] items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-3.5 text-sm font-bold text-gray-950 shadow-lg shadow-black/25 ring-2 ring-white/25 transition hover:brightness-105 hover:ring-white/40 focus:outline-none focus:ring-4 focus:ring-amber-300/50"
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
