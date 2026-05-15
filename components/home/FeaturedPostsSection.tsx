import Link from "next/link";
import { Clock } from "lucide-react";
import type { HomepageCopy } from "@/lib/site/types";

export interface HomePostCard {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  publishedAt: Date | null;
  readingTime: number;
  category: {
    name: string;
    nameEn: string | null;
    slug: string;
  } | null;
}

interface Props {
  locale: string;
  posts: HomePostCard[];
  copy: HomepageCopy["featuredPosts"];
}

export default function FeaturedPostsSection({ locale, posts, copy }: Props) {
  const isEn = locale === "en";
  const prefix = isEn ? "/en" : "/zh-TW";

  return (
    <section id="featured" className="bg-gray-50 py-18">
      <div className="mx-auto max-w-6xl px-4">
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
            {isEn ? copy.browseAllEn : copy.browseAll} →
          </Link>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="list">
          {posts.map((post) => {
            const title = isEn ? (post.titleEn ?? post.title) : post.title;
            const excerpt = isEn ? post.excerptEn : post.excerpt;
            const category = isEn
              ? (post.category?.nameEn ?? post.category?.name)
              : post.category?.name;

            return (
              <article
                key={post.id}
                role="listitem"
                className="flex min-h-72 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm shadow-blue-100/30 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/70"
              >
                {category && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    {category}
                  </span>
                )}
                <h3 className="mt-3 line-clamp-2 min-h-14 text-xl font-bold leading-snug text-gray-950">
                  <Link href={`${prefix}/blog/${post.slug}`} className="hover:text-blue-700">
                    {title}
                  </Link>
                </h3>
                <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-gray-600 line-clamp-3">
                  {excerpt?.trim() ? excerpt : "\u00a0"}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs font-medium text-gray-500">
                  <time dateTime={post.publishedAt?.toISOString()}>
                    {post.publishedAt?.toLocaleDateString(isEn ? "en-US" : "zh-TW")}
                  </time>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
                    <span>
                      {post.readingTime} {isEn ? copy.minReadEn : copy.minRead}
                    </span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
