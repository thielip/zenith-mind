// components/blog/TableOfContents.tsx — Client Component
// 從 HTML 內容提取 H2/H3，產生可點擊目錄

"use client";

import { useMemo } from "react";

interface Heading {
  level: 2 | 3;
  id:    string;
  text:  string;
}

interface Props {
  content: string;
}

function extractHeadings(html: string): Heading[] {
  // Server 渲染時無 DOM，用 regex 提取（僅 h2/h3）
  const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[23]>/g;
  const headings: Heading[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1] ?? "2", 10) as 2 | 3,
      id:    match[2] ?? "",
      text:  match[3] ?? "",
    });
  }
  return headings;
}

export default function TableOfContents({ content }: Props) {
  const headings = useMemo(() => extractHeadings(content), [content]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="文章目錄">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        目錄
      </h2>
      <ol className="space-y-1.5">
        {headings.map((h) => (
          <li
            key={h.id}
            className={h.level === 3 ? "pl-3" : ""}
          >
            <a
              href={`#${h.id}`}
              className="block text-sm text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
