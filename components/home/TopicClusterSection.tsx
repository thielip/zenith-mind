import Link from "next/link";
import ResponsiveImage from "@/components/ui/ResponsiveImage";
import { topicIconForSlug } from "@/lib/categories/topic-icons";
import { isExternalHttpUrl, EXTERNAL_LINK_REL } from "@/lib/site/external-link";
import { isValidExternalImageUrl } from "@/lib/validation/external-image-url";
import type { HomepageCopy } from "@/lib/site/types";

interface Topic {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  imageUrl?: string;
  imageAlt?: string;
  href?: string;
  imageUrlEn?: string;
  imageAltEn?: string;
  hrefEn?: string;
}

interface Props {
  locale: string;
  topics: Topic[];
  copy: HomepageCopy["topicClusters"];
}

export default function TopicClusterSection({ locale, topics, copy }: Props) {
  const isEn = locale === "en";
  const prefix = isEn ? "/en" : "/zh-TW";

  return (
    <section id="topics" className="mx-auto max-w-6xl px-4 py-18">
      <header className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            {isEn ? copy.eyebrowEn : copy.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-[2.25rem]">
            {isEn ? copy.titleEn : copy.title}
          </h2>
        </div>
        <Link href={`${prefix}/blog`} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
          {isEn ? copy.viewAllEn : copy.viewAll} →
        </Link>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => {
          const title = isEn ? topic.nameEn : topic.name;
          const imageUrlPrimary = isEn
            ? (topic.imageUrlEn?.trim() || topic.imageUrl?.trim() || "")
            : (topic.imageUrl?.trim() || "");
          const showImage =
            imageUrlPrimary.length > 0 && isValidExternalImageUrl(imageUrlPrimary);
          const hrefRaw = (isEn ? topic.hrefEn?.trim() : topic.href?.trim()) || "";
          const imageAlt = isEn
            ? topic.imageAltEn?.trim() || topic.imageAlt?.trim() || title
            : topic.imageAlt?.trim() || title;
          const defaultHref = `${prefix}/blog?category=${topic.slug}`;
          const cardHref = hrefRaw
            ? hrefRaw.startsWith("/") || hrefRaw.startsWith("#")
              ? hrefRaw.startsWith("/")
                ? `${prefix}${hrefRaw}`
                : hrefRaw
              : hrefRaw
            : defaultHref;
          const external = isExternalHttpUrl(cardHref);

          const cardInner = (
            <>
              {showImage ? (
                <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-gray-100">
                  <ResponsiveImage
                    src={imageUrlPrimary}
                    alt={imageAlt}
                    fill
                    responsiveWidths={[280, 360, 480]}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={54}
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              ) : (
                (() => {
                  const Icon = topicIconForSlug(topic.slug);
                  return (
                    <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 ring-1 ring-blue-100/80 transition group-hover:scale-105 group-hover:from-blue-100 group-hover:to-indigo-50 group-hover:text-blue-800">
                      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                  );
                })()
              )}
              <div className={showImage ? "flex flex-1 flex-col p-6 pt-4" : "flex flex-1 flex-col"}>
                <p className="line-clamp-2 min-h-14 text-lg font-bold leading-7 text-gray-950">
                  {title}
                </p>
                <p className="mt-3 line-clamp-4 min-h-24 text-sm leading-6 text-gray-600">
                  {isEn ? topic.descriptionEn : topic.description}
                </p>
                <span className="mt-auto inline-flex pt-5 text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                  {isEn ? copy.exploreEn : copy.explore} →
                </span>
              </div>
            </>
          );

          const cardClass = [
            "group flex min-h-64 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-blue-100/30 transition duration-200 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-200/60",
            showImage ? "" : "p-6",
          ].join(" ");

          return (
            <li key={topic.slug}>
              {external ? (
                <a
                  href={cardHref}
                  target="_blank"
                  rel={EXTERNAL_LINK_REL}
                  className={cardClass}
                >
                  {cardInner}
                </a>
              ) : (
                <Link href={cardHref} className={cardClass}>
                  {cardInner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
