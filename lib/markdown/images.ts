const IMAGE_MARKDOWN_RE = /!\[([^\]\n]*)\]\((https?:\/\/[^\s)"'<]+)(?:\s+"([^"\n]*)")?\)/g;

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function convertMarkdownImagesToHtml(content: string): string {
  return content.replace(IMAGE_MARKDOWN_RE, (_match, alt: string, src: string, title?: string) => {
    const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
    return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}"${titleAttr}>`;
  });
}
