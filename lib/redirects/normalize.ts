/**
 * Redirect 路徑正規化：比對僅用 pathname，結尾斜線統一移除（根路徑除外）。
 */

export type ParsedRedirectPath = {
  pathname: string;
  search: string;
};

/** 將 pathname 正規化為比對用格式（不含 query） */
export function normalizeRedirectPathname(pathname: string): string {
  let p = pathname.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1);
  }
  return p === "" ? "/" : p;
}

/** 拆分完整路徑字串（可含 ?query），pathname 會正規化 */
export function parseRedirectPath(path: string): ParsedRedirectPath {
  const raw = path.trim();
  const q = raw.indexOf("?");
  if (q === -1) {
    return { pathname: normalizeRedirectPathname(raw), search: "" };
  }
  return {
    pathname: normalizeRedirectPathname(raw.slice(0, q)),
    search: raw.slice(q),
  };
}

/** 比對兩個路徑是否為同一目的地（僅 pathname，忽略 query） */
export function redirectPathnamesEqual(a: string, b: string): boolean {
  return parseRedirectPath(a).pathname === parseRedirectPath(b).pathname;
}

/** 是否為自我轉址（source pathname === destination pathname） */
export function isSelfRedirect(source: string, destination: string): boolean {
  const from = parseRedirectPath(source);
  const to = parseRedirectPath(destination);
  return from.pathname === to.pathname;
}

/** 合併轉址目標 query：目標規則優先，再補上原始請求未覆蓋的參數 */
export function mergeRedirectSearch(
  ruleSearch: string,
  requestSearch: string
): string {
  const merged = new URLSearchParams(
    ruleSearch.startsWith("?") ? ruleSearch.slice(1) : ruleSearch
  );
  const incoming = new URLSearchParams(
    requestSearch.startsWith("?") ? requestSearch.slice(1) : requestSearch
  );
  incoming.forEach((value, key) => {
    if (!merged.has(key)) merged.set(key, value);
  });
  const s = merged.toString();
  return s ? `?${s}` : "";
}
