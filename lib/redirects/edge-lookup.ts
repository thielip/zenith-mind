import type { ActiveRedirect } from "@/lib/redirects/shared";
import {
  normalizeStoredNewPath,
  normalizeStoredOldPath,
} from "@/lib/redirects/shared";
import { isSelfRedirect } from "@/lib/redirects/normalize";
import { logRedirectWarn } from "@/lib/redirects/log";

type RedirectRow = { newPath: string; statusCode: number };

/**
 * Edge Middleware 專用：經 Supabase PostgREST 查 redirects（避免 Prisma / 內部 HTTP）。
 */
export async function findActiveRedirectViaSupabase(
  rawPath: string
): Promise<ActiveRedirect | null> {
  const base = process.env["NEXT_PUBLIC_SUPABASE_URL"]?.trim();
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!base || !key) return null;

  const oldPath = normalizeStoredOldPath(rawPath);
  if (!oldPath.startsWith("/")) return null;

  const url = new URL(`${base.replace(/\/$/, "")}/rest/v1/redirects`);
  url.searchParams.set("select", "newPath,statusCode");
  url.searchParams.set("oldPath", `eq.${oldPath}`);
  url.searchParams.set("isActive", "eq.true");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const rows = (await res.json()) as RedirectRow[];
  const row = rows[0];
  if (!row?.newPath?.trim()) return null;

  const newPath = normalizeStoredNewPath(row.newPath.trim());
  if (isSelfRedirect(oldPath, newPath)) {
    logRedirectWarn("self-redirect in db ignored (edge)", { oldPath, newPath });
    return null;
  }

  return {
    newPath,
    statusCode: row.statusCode === 302 ? 302 : 301,
  };
}
