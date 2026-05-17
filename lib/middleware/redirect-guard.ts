import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveSafeFirstRedirectHop } from "@/lib/redirects/cycle";
import { shouldSkipRedirectLookup } from "@/lib/redirects/matcher";
import {
  logRedirectError,
  logRedirectHit,
  logRedirectWarn,
} from "@/lib/redirects/log";
import {
  mergeRedirectSearch,
  normalizeRedirectPathname,
  parseRedirectPath,
} from "@/lib/redirects/normalize";
import { findActiveRedirectViaSupabase } from "@/lib/redirects/edge-lookup";
import {
  getRedirectFromCache,
  setRedirectCache,
} from "@/lib/redirects/redis-cache";
import type { ActiveRedirect } from "@/lib/redirects/queries";

function buildRedirectTarget(
  request: NextRequest,
  newPath: string
): { url: URL; pathname: string } {
  const parsed = parseRedirectPath(newPath);
  const target = new URL(request.url);
  target.pathname = parsed.pathname;
  target.search = mergeRedirectSearch(parsed.search, request.nextUrl.search);
  return { url: target, pathname: parsed.pathname };
}

async function lookupRedirectHop(
  pathname: string
): Promise<ActiveRedirect | null> {
  const cached = await getRedirectFromCache(pathname);
  if (cached.kind === "hit") return cached.redirect;
  if (cached.kind === "negative") return null;

  const hit = await findActiveRedirectViaSupabase(pathname);
  await setRedirectCache(pathname, hit);
  return hit;
}

export async function redirectGuard(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = normalizeRedirectPathname(request.nextUrl.pathname);

  if (shouldSkipRedirectLookup(pathname)) return null;

  try {
    const hit = await resolveSafeFirstRedirectHop(pathname, async (path) => {
      const row = await lookupRedirectHop(path);
      if (!row) return null;
      return {
        newPath: row.newPath,
        statusCode: row.statusCode,
      };
    });

    if (!hit) return null;

    const { url: target, pathname: destPathname } = buildRedirectTarget(
      request,
      hit.newPath
    );

    if (normalizeRedirectPathname(destPathname) === pathname) {
      logRedirectWarn("loop prevented after normalize", {
        from: pathname,
        to: destPathname,
      });
      return null;
    }

    const status = hit.statusCode === 302 ? 302 : 301;
    logRedirectHit(pathname, target.toString(), status);
    return NextResponse.redirect(target, status);
  } catch (error) {
    logRedirectError("lookup failed", error, { pathname });
    return null;
  }
}
