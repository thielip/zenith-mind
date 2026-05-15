import type { HomepageCopy } from "@/lib/site/types";

interface Props {
  locale: string;
  publishedPosts: number;
  categoryCount: number;
  /** 首頁瀏覽次數（postId 為 null 的 PageView，依語系） */
  homePageViews: number;
  copy: HomepageCopy["socialProof"];
}

export default function SocialProofSection({
  locale,
  publishedPosts,
  categoryCount,
  homePageViews,
  copy,
}: Props) {
  const isEn = locale === "en";
  const stats = [
    {
      value: publishedPosts,
      label: isEn ? copy.statPostsLabelEn : copy.statPostsLabel,
    },
    {
      value: categoryCount,
      label: isEn ? copy.statTopicsLabelEn : copy.statTopicsLabel,
    },
    {
      value: homePageViews,
      label: isEn ? copy.statViewsLabelEn : copy.statViewsLabel,
    },
  ];
  const badges = isEn ? copy.badgesEn : copy.badges;

  return (
    <section id="social-proof" className="border-y border-blue-100 bg-white py-12" aria-labelledby="social-proof-title">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm shadow-blue-100/60 lg:grid-cols-[1fr_1.1fr] lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              {isEn ? copy.eyebrowEn : copy.eyebrow}
            </p>
            <h2 id="social-proof-title" className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              {isEn ? copy.titleEn : copy.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600">
              {isEn ? copy.leadEn : copy.lead}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat, idx) => (
              <article key={`stat-${idx}`} className="rounded-2xl border border-white bg-white/85 p-5 text-center shadow-sm">
                <p className="text-3xl font-bold text-gray-950">{stat.value.toLocaleString()}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {stat.label}
                </p>
              </article>
            ))}
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, i) => (
                <span
                  key={`badge-${i}`}
                  className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
