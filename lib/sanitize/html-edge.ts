/**
 * Cloudflare Worker 公開站：輕量 HTML 清洗（避免 sanitize-html CPU 超限）。
 * 內容已在後台寫入時消毒；此處僅移除高風險片段。
 */
export function sanitizeRichTextEdge(dirty: string): string {
  if (!dirty) return "";
  let out = dirty;
  out = out.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  out = out.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  out = out.replace(/javascript:/gi, "");
  return out;
}
