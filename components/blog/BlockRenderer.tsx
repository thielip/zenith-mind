// components/blog/BlockRenderer.tsx — Server Component
// 依區塊型別渲染；圖片走 next/image + 契約寬高

import Image from "next/image";
import type { ContentBlock } from "@/lib/content-blocks/schema";
import { sanitizeRichText } from "@/lib/sanitize/html";

interface Props {
  blocks: ContentBlock[];
}

export default function BlockRenderer({ blocks }: Props) {
  return (
    <div
      data-article-blocks
      className="prose prose-lg prose-gray max-w-none space-y-6 overflow-hidden prose-headings:scroll-mt-20 prose-img:mx-auto prose-img:max-w-full prose-img:rounded-xl"
    >
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <div
                key={`paragraph-${i}`}
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(block.data.html),
                }}
              />
            );
          case "image": {
            const { url, width, height, alt } = block.data;
            return (
              <figure key={i} className="my-6">
                <Image
                  src={url}
                  alt={alt}
                  width={width}
                  height={height}
                  className="h-auto w-full rounded-xl object-cover"
                  sizes="(max-width: 896px) 100vw, 896px"
                />
              </figure>
            );
          }
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-sm text-gray-100"
              >
                <code className={block.data.language ? `language-${block.data.language}` : undefined}>
                  {block.data.code}
                </code>
              </pre>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-blue-500 pl-4 italic text-gray-700"
                cite={block.data.cite}
              >
                <p>{block.data.text}</p>
              </blockquote>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
