/**
 * 公開站文章渲染（僅輕量清洗，不 bundle sanitize-html 進 Cloudflare Worker）
 */
export { sanitizeRichTextEdge as sanitizeRichTextForDisplay } from "@/lib/sanitize/html-edge";
