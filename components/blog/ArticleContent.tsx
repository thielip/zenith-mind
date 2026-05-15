// components/blog/ArticleContent.tsx — Server Component
// 富文本安全渲染（sanitize-html 白名單清洗）
// ⚠ dangerouslySetInnerHTML 必須搭配清洗，絕不直接渲染原始 HTML

import { sanitizeRichText } from "@/lib/sanitize/html";
import { convertMarkdownImagesToHtml } from "@/lib/markdown/images";

interface Props {
  content:     string;
  contentType: string; // "markdown" | "tiptap"
}

export default function ArticleContent({ content, contentType }: Props) {
  const raw = typeof content === "string" ? content : "";
  const cleanHtml = sanitizeRichText(convertMarkdownImagesToHtml(raw || "<p></p>"));

  return (
    <article
      data-article-content
      className="prose prose-lg prose-gray max-w-none overflow-hidden prose-headings:scroll-mt-20 prose-headings:font-bold prose-h1:text-4xl prose-h1:tracking-tight prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h2:text-3xl prose-h2:tracking-tight prose-h3:mt-8 prose-h3:text-2xl prose-p:text-[1.05rem] prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:mx-auto prose-img:max-w-full prose-img:rounded-xl prose-pre:bg-gray-900"
      aria-label="文章內容"
      // eslint-disable-next-line @typescript-eslint/naming-convention
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
