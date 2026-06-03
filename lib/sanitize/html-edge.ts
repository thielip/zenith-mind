/**
 * Cloudflare Worker 公開站：標籤／屬性白名單清洗（對齊 lib/sanitize/html.ts，無 sanitize-html 依賴）。
 * 後台寫入仍經 sanitizeRichText；此為公開渲染第二道防線。
 */

/** 與 Node sanitizeRichText 一致 */
const ALLOWED_TAGS = new Set([
  "h2",
  "h3",
  "h4",
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
]);

const GLOBAL_ATTRS = new Set(["class"]);
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "class"]),
  img: new Set(["src", "alt", "width", "height", "class"]),
  code: new Set(["class"]),
  th: new Set(["colspan", "rowspan", "class"]),
  td: new Set(["colspan", "rowspan", "class"]),
};

const FORBIDDEN_TAG_NAMES = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "link",
  "meta",
  "style",
  "svg",
  "math",
  "base",
  "template",
  "slot",
]);

const UNSAFE_URI = /^\s*(javascript|vbscript|data)\s*:/i;

function allowedAttrsForTag(tag: string): Set<string> {
  const specific = TAG_ATTRS[tag];
  if (specific) return new Set([...GLOBAL_ATTRS, ...specific]);
  return GLOBAL_ATTRS;
}

function sanitizeAttributeValue(name: string, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^on/i.test(name)) return null;
  if ((name === "href" || name === "src") && UNSAFE_URI.test(v)) return null;
  if (name === "src" && /^data:/i.test(v)) return null;
  return v.replace(/[\x00-\x1f\x7f]/g, "");
}

function sanitizeOpenTag(tag: string, rawAttrs: string): string {
  const lower = tag.toLowerCase();
  if (FORBIDDEN_TAG_NAMES.has(lower) || !ALLOWED_TAGS.has(lower)) {
    return "";
  }

  const allowed = allowedAttrsForTag(lower);
  const attrParts: string[] = [];
  const attrRe =
    /([a-zA-Z][\w:.-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(rawAttrs)) !== null) {
    const rawName = m[1];
    if (!rawName) continue;
    const name = rawName.toLowerCase();
    if (!allowed.has(name)) continue;
    const rawVal = m[2] ?? m[3] ?? m[4] ?? "";
    const safe = sanitizeAttributeValue(name, rawVal);
    if (safe === null) continue;
    attrParts.push(`${name}="${safe.replace(/"/g, "&quot;")}"`);
  }

  if (lower === "a" && !attrParts.some((p) => p.startsWith('rel="'))) {
    attrParts.push('rel="noopener noreferrer"');
  }

  const attrs = attrParts.length ? ` ${attrParts.join(" ")}` : "";
  return `<${lower}${attrs}>`;
}

function stripForbiddenBlocks(html: string): string {
  let out = html;
  for (const tag of FORBIDDEN_TAG_NAMES) {
    const re = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`,
      "gi"
    );
    out = out.replace(re, "");
    out = out.replace(new RegExp(`<${tag}\\b[^>]*/?>`, "gi"), "");
  }
  out = out.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  out = out.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  return out;
}

/**
 * 公開站富文本：白名單標籤 + 屬性過濾 + 移除危險 URI
 */
export function sanitizeRichTextEdge(dirty: string): string {
  if (!dirty) return "";

  let out = stripForbiddenBlocks(dirty);
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  out = out.replace(/javascript:/gi, "");

  out = out.replace(/<\/?([a-zA-Z][\w-]*)([^>]*)>/g, (match, tag: string, rest: string) => {
    const isClose = match.startsWith("</");
    const lower = tag.toLowerCase();
    if (FORBIDDEN_TAG_NAMES.has(lower) || !ALLOWED_TAGS.has(lower)) {
      return "";
    }
    if (isClose) return `</${lower}>`;
    return sanitizeOpenTag(lower, rest ?? "");
  });

  return out;
}
