import Link from "next/link";
import { topicIconForSlug } from "@/lib/categories/topic-icons";
import type { HomepageCopy } from "@/lib/site/types";

interface Topic {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
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
        {topics.map((topic) => (
          <li key={topic.slug}>
          <Link
            href={`${prefix}/blog?category=${topic.slug}`}
            className="group flex min-h-64 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm shadow-blue-100/30 transition duration-200 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-200/60"
          >
            {(() => {
              const Icon = topicIconForSlug(topic.slug);
              return (
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 ring-1 ring-blue-100/80 transition group-hover:scale-105 group-hover:from-blue-100 group-hover:to-indigo-50 group-hover:text-blue-800">
                  <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                </span>
              );
            })()}
            <p className="line-clamp-2 min-h-14 text-lg font-bold leading-7 text-gray-950">
              {isEn ? topic.nameEn : topic.name}
            </p>
            <p className="mt-3 line-clamp-4 min-h-24 text-sm leading-6 text-gray-600">
              {isEn ? topic.descriptionEn : topic.description}
            </p>
            <span className="mt-auto inline-flex pt-5 text-sm font-semibold text-blue-700 group-hover:text-blue-800">
              {isEn ? copy.exploreEn : copy.explore} →
            </span>
          </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
