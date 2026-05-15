import { NextRequest, NextResponse } from "next/server";
import { findActiveRedirect } from "@/lib/redirects/queries";
import { logRedirectMiss, logRedirectWarn } from "@/lib/redirects/log";
import { normalizeRedirectPathname } from "@/lib/redirects/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTERNAL_HEADER = "x-redirect-internal";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env["REDIRECT_LOOKUP_SECRET"] ?? "dev-redirect";
  const provided = req.headers.get(INTERNAL_HEADER);
  if (provided === secret) return true;
  return process.env["NODE_ENV"] !== "production";
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    logRedirectWarn("lookup forbidden");
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const raw = req.nextUrl.searchParams.get("path")?.trim();
  if (!raw || !raw.startsWith("/")) {
    return NextResponse.json({ hit: false });
  }

  // 比對僅用 pathname（忽略 query）；尾斜線統一
  const pathname = normalizeRedirectPathname(raw);

  const hit = await findActiveRedirect(pathname);
  if (!hit) {
    logRedirectMiss(pathname);
    return NextResponse.json({ hit: false });
  }

  return NextResponse.json({
    hit: true,
    newPath: hit.newPath,
    statusCode: hit.statusCode,
  });
}
