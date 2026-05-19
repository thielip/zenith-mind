export function isExternalHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

/** 外部連結：避免 Next prefetch / 投機載入第三方（如 casino player API） */
export const EXTERNAL_LINK_REL = "noopener noreferrer nofollow";
