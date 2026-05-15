// lib/sanitize/html.ts — Node Runtime
// sanitize-html 白名單清洗（取代 DOMPurify+jsdom）
// 適合 Tiptap 輸出（結構可控，非任意 HTML）
// 無 DOM 環境開銷，Serverless 冷啟動友好

import sanitizeHtml from "sanitize-html";

/** 富文本白名單（Tiptap 允許的標籤）*/
export function sanitizeRichText(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "h2", "h3", "h4",
      "p", "br", "strong", "em", "u", "s",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a:   ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      code: ["class"],  // syntax highlighting class
      "*": ["class"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    // 強制外部連結加 rel noopener（防 tabnapping）
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          ...(attribs["href"]?.startsWith("http") ? { target: "_blank" } : {}),
        },
      }),
    },
  });
}

/** 純文字清洗（移除所有 HTML）*/
export function sanitizeText(dirty: string): string {
  return sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} });
}
