// components/blog/PostArticleBody.tsx — Server Component
// 有通過契約的 contentBlocks 時優先渲染；否則回退 HTML（Tiptap / Markdown 轉 HTML）

import { parseContentBlocksForLocale } from "@/lib/content-blocks/schema";
import ArticleContent from "./ArticleContent";
import BlockRenderer from "./BlockRenderer";

interface Props {
  locale: string;
  content: string;
  contentType: string;
  contentBlocks: unknown;
}

export default function PostArticleBody({
  locale,
  content,
  contentType,
  contentBlocks,
}: Props) {
  const loc = locale === "en" ? "en" : "zh-TW";
  const blocks = parseContentBlocksForLocale(contentBlocks, loc);

  if (blocks.length > 0) {
    return <BlockRenderer blocks={blocks} />;
  }

  return <ArticleContent content={content} contentType={contentType} />;
}
