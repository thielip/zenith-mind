// components/blog/RecommendedPosts.tsx — Server Component
// 相關文章推薦（同分類，排除當前文章）

import Link from "next/link";
import Image from "next/image";
import { loadRecommendedPosts } from "@/lib/blog/load-blog-post-data";

interface Props {
  currentPostId: string;
  categoryId?:   string;
  locale:        string;
}

export default async function RecommendedPosts({
  currentPostId,
  categoryId,
  locale,
}: Props) {
  const isEn = locale === "en";
  const basePath = `/${isEn ? "en" : "zh-TW"}/blog`;

  const posts = await loadRecommendedPosts(currentPostId, categoryId, locale);

  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="recommended-heading"
      className="mt-16 border-t pt-10"
    >
      <h2
        id="recommended-heading"
        className="mb-6 text-xl font-bold text-gray-900"
      >
        {isEn ? "Related Articles" : "相關文章"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {posts.map((post) => {
          const title = isEn ? (post.titleEn ?? post.title) : post.title;
          return (
            <article key={post.slug}>
              <Link
                href={`${basePath}/${post.slug}`}
                className="group block rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {post.coverImage && (
                  <Image
                    src={post.coverImage}
                    alt={post.coverImageAlt ?? title}
                    width={400}
                    height={225}
                    loading="lazy"
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="h-36 w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {title}
                  </h3>
                  <time
                    dateTime={post.publishedAt?.toISOString()}
                    className="mt-1 block text-xs text-gray-400"
                  >
                    {post.publishedAt?.toLocaleDateString(isEn ? "en-US" : "zh-TW")}
                  </time>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
