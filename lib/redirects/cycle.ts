import {
  isSelfRedirect,
  normalizeRedirectPathname,
  parseRedirectPath,
} from "@/lib/redirects/normalize";

/** Middleware / DB 寫入共用的最大轉址鏈深度 */
export const MAX_REDIRECT_CHAIN_DEPTH = 3;

export type RedirectLookupResult = {
  newPath: string;
  statusCode: number;
};

/**
 * 沿著轉址鏈前進，若會回到起點、重訪路徑或超過深度則視為循環。
 * 回傳第一跳（供 middleware 單次 301/302）；無安全第一跳則 null。
 */
export async function resolveSafeFirstRedirectHop(
  startPathname: string,
  lookup: (pathname: string) => Promise<RedirectLookupResult | null>,
  maxDepth: number = MAX_REDIRECT_CHAIN_DEPTH
): Promise<RedirectLookupResult | null> {
  const start = normalizeRedirectPathname(startPathname);
  const visited = new Set<string>([start]);
  let current = start;
  let firstHop: RedirectLookupResult | null = null;

  for (let depth = 0; depth < maxDepth; depth++) {
    const hit = await lookup(current);
    if (!hit?.newPath?.trim()) break;

    if (isSelfRedirect(current, hit.newPath)) return null;

    const dest = normalizeRedirectPathname(
      parseRedirectPath(hit.newPath).pathname
    );

    if (dest === start || visited.has(dest)) return null;

    if (!firstHop) firstHop = hit;

    visited.add(dest);
    current = dest;
  }

  return firstHop;
}

/**
 * 寫入前檢查：newPath 往後追蹤是否會回到 oldPath，或已存在反向規則。
 */
export async function wouldCreateRedirectCycle(
  oldPath: string,
  newPath: string,
  lookup: (pathname: string) => Promise<{ newPath: string } | null>,
  maxDepth: number = MAX_REDIRECT_CHAIN_DEPTH
): Promise<boolean> {
  const source = normalizeRedirectPathname(parseRedirectPath(oldPath).pathname);
  const dest = normalizeRedirectPathname(parseRedirectPath(newPath).pathname);

  if (source === dest || isSelfRedirect(oldPath, newPath)) return true;

  const reverse = await lookup(dest);
  if (reverse) {
    const reverseDest = normalizeRedirectPathname(
      parseRedirectPath(reverse.newPath).pathname
    );
    if (reverseDest === source) return true;
  }

  const visited = new Set<string>([source]);
  let current = dest;

  for (let depth = 0; depth < maxDepth; depth++) {
    if (visited.has(current)) return true;
    visited.add(current);

    const hit = await lookup(current);
    if (!hit?.newPath?.trim()) return false;

    const next = normalizeRedirectPathname(
      parseRedirectPath(hit.newPath).pathname
    );
    if (next === source) return true;

    current = next;
  }

  return false;
}
