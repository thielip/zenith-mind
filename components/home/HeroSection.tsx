import Link from "next/link";
import NewsletterSignup from "@/components/marketing/NewsletterSignup";

interface Props {
  locale: string;
}

export default function HeroSection({ locale }: Props) {
  const isEn = locale === "en";
  const prefix = isEn ? "/en" : "/zh-TW";
  const signals = isEn
    ? ["SEO", "GEO", "SGO", "AI Workflow"]
    : ["SEO", "GEO", "SGO", "AI 工作流"];

  return (
    <section className="relative overflow-hidden border-b border-gray-100 bg-[radial-gradient(circle_at_top_left,#bfdbfe,transparent_30%),radial-gradient(circle_at_85%_20%,#e0e7ff,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_72%)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(#dbeafe_1px,transparent_1px),linear-gradient(90deg,#dbeafe_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            {isEn ? "Content Media + Personal Brand" : "內容媒體 × 個人品牌 × SEO 變現"}
          </p>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
            {isEn
              ? "Build your Zenith Mind for AI, investing and personal brand growth."
              : "打造你的巔峰思維，讓知識內容變成長期流量資產。"}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            {isEn
              ? "Zenith Mind is a bilingual knowledge platform covering AI tools, quantitative thinking, real estate, content monetization and SEO-led growth."
              : "巔峰思維聚焦 AI 工具、量化交易、房地產、知識變現與個人品牌，用 SEO 內容累積自然流量，未來延伸電子報、聯盟行銷、課程與顧問服務。"}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`${prefix}/blog`}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 px-8 py-3.5 text-sm font-bold text-gray-950 shadow-lg shadow-orange-200/50 ring-2 ring-white/40 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-amber-300/60"
            >
              {isEn ? "Explore articles" : "探索文章"}
            </Link>
            <a
              href="#newsletter"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white/90 px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isEn ? "Join the newsletter" : "訂閱電子報"}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {signals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-xs font-semibold text-blue-800 shadow-sm shadow-blue-100"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>

        <div className="relative rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-xl shadow-blue-100/50 backdrop-blur">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-6 top-6 h-16 w-16 rounded-full border border-blue-200 bg-blue-50"
          />
          <div className="relative mb-5">
            <p className="text-sm font-semibold text-gray-900">
              {isEn ? "Weekly edge for builders and investors" : "每週給知識創作者與投資者的精選洞察"}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {isEn
                ? "Get practical frameworks for AI tools, SEO content, investing and monetizing personal expertise."
                : "掌握 AI 工具、SEO 內容、投資理財與個人專業變現的實戰框架。"}
            </p>
          </div>
          <NewsletterSignup locale={locale} source="homepage-hero" compact />
        </div>
      </div>
    </section>
  );
}
