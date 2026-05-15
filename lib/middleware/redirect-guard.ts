import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { shouldSkipRedirectLookup } from "@/lib/redirects/matcher";
import {
  logRedirectError,
  logRedirectHit,
  logRedirectWarn,
} from "@/lib/redirects/log";
import {
  isSelfRedirect,
  mergeRedirectSearch,
  normalizeRedirectPathname,
  parseRedirectPath,
} from "@/lib/redirects/normalize";

const INTERNAL_HEADER = "x-redirect-internal";

function lookupSecret(): string {
  return process.env["REDIRECT_LOOKUP_SECRET"] ?? "dev-redirect";
}

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

export async function redirectGuard(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = normalizeRedirectPathname(request.nextUrl.pathname);

  if (shouldSkipRedirectLookup(pathname)) return null;

  const lookupUrl = new URL("/api/redirect", request.url);
  lookupUrl.searchParams.set("path", pathname);

  try {
    const res = await fetch(lookupUrl.toString(), {
      headers: { [INTERNAL_HEADER]: lookupSecret() },
      cache: "no-store",
    });

    if (!res.ok) {
      logRedirectWarn("lookup api non-ok", {
        pathname,
        status: res.status,
      });
      return null;
    }

    const data = (await res.json()) as {
      hit?: boolean;
      newPath?: string;
      statusCode?: number;
    };

    if (!data.hit || !data.newPath) return null;

    if (isSelfRedirect(pathname, data.newPath)) {
      logRedirectWarn("loop prevented", {
        from: pathname,
        to: data.newPath,
      });
      return null;
    }

    const { url: target, pathname: destPathname } = buildRedirectTarget(
      request,
      data.newPath
    );

    if (normalizeRedirectPathname(destPathname) === pathname) {
      logRedirectWarn("loop prevented after normalize", {
        from: pathname,
        to: destPathname,
      });
      return null;
    }

    const status = data.statusCode === 302 ? 302 : 301;
    logRedirectHit(pathname, target.toString(), status);
    return NextResponse.redirect(target, status);
  } catch (error) {
    logRedirectError("lookup failed", error, { pathname });
    return null;
  }
}
