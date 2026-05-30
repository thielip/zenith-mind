import BlogPostUnavailable from "@/components/blog/BlogPostUnavailable";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

/** 文章確實不存在時的友善 404（取代 Next 預設樣式） */
export default async function BlogPostNotFound({ params }: Props) {
  const resolved = params ? await params : null;
  const locale = resolved?.locale ?? "zh-TW";
  const slug = resolved?.slug ?? "";
  return <BlogPostUnavailable locale={locale} slug={slug} reason="missing" />;
}
