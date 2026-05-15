"use client";

import { Search, X } from "lucide-react";

interface TagOption {
  slug: string;
  name: string;
  nameEn: string | null;
}

interface Props {
  locale: string;
  basePath: string;
  query: string;
  category?: string;
  activeTag?: string;
  tags: TagOption[];
}

export default function BlogSearchFilters({
  locale,
  basePath,
  query,
  category,
  activeTag,
  tags,
}: Props) {
  const isEn = locale === "en";

  return (
    <section
      className="mb-8 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60"
      aria-labelledby="blog-filter-title"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            {isEn ? "Search & Filter" : "搜尋與篩選"}
          </p>
          <h2 id="blog-filter-title" className="mt-1 text-xl font-bold text-gray-950">
            {isEn ? "Find the right article faster" : "更快找到你需要的文章"}
          </h2>
        </div>

        <form action={basePath} className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
          {category && <input type="hidden" name="category" value={category} />}
          {activeTag && <input type="hidden" name="tag" value={activeTag} />}
          <label className="relative flex-1">
            <span className="sr-only">{isEn ? "Search articles" : "搜尋文章"}</span>
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              name="q"
              defaultValue={query}
              placeholder={isEn ? "Search AI, SEO, investing..." : "搜尋 AI、SEO、投資理財..."}
              className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isEn ? "Search" : "搜尋"}
          </button>
          {(query || category || activeTag) && (
            <a
              href={basePath}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X size={14} aria-hidden="true" />
              {isEn ? "Reset" : "清除"}
            </a>
          )}
        </form>
      </div>

      {tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2" aria-label={isEn ? "Filter by tag" : "依標籤篩選"}>
          {tags.map((tag) => {
            const label = isEn ? (tag.nameEn ?? tag.name) : tag.name;
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (category) params.set("category", category);
            if (activeTag !== tag.slug) params.set("tag", tag.slug);
            const href = params.toString() ? `${basePath}?${params.toString()}` : basePath;

            return (
              <a
                key={tag.slug}
                href={href}
                aria-current={activeTag === tag.slug ? "page" : undefined}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  activeTag === tag.slug
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
                ].join(" ")}
              >
                #{label}
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
