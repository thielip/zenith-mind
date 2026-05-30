import Link from "next/link";
import { getPublicLocaleHomeUrl } from "@/lib/site/url";

export type BlogPostUnavailableReason = "missing" | "unavailable";

interface Props {
  locale: string;
  slug: string;
  reason: BlogPostUnavailableReason;
}

/** 部落格文章無法顯示時的友善頁（非 Next 預設 404 白屏） */
export default function BlogPostUnavailable({ locale, slug, reason }: Props) {
  const isEn = locale === "en";
  const home = getPublicLocaleHomeUrl(isEn ? "en" : "zh-TW");
  const blogHref = `/${isEn ? "en" : "zh-TW"}/blog`;

  const title =
    reason === "missing"
      ? isEn
        ? "Article not found"
        : "找不到這篇文章"
      : isEn
        ? "This article is temporarily unavailable"
        : "文章暫時無法載入";

  const description =
    reason === "missing"
      ? isEn
        ? "The link may be outdated or the article was removed."
        : "連結可能已失效，或文章已下架。"
      : isEn
        ? "Our servers are busy or content is updating. Please try again in a few minutes — this is not because the article does not exist."
        : "伺服器忙碌或內容更新中，請稍後再試。這通常不是因為文章不存在，而是暫時無法讀取。";

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {isEn ? "Blog" : "部落格"}
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="font-mono">{slug}</span>
      </p>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href={blogHref}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {isEn ? "Back to blog" : "返回文章列表"}
        </Link>
        <Link
          href={home}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {isEn ? "Home" : "回首頁"}
        </Link>
      </div>
    </div>
  );
}
