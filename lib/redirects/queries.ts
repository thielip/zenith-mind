import { prisma } from "@/infrastructure/db/prisma";
import type { PublicLocale } from "@/lib/redirects/paths";
import {
  postArticlePath,
  postDeleteRedirectTarget,
} from "@/lib/redirects/paths";
import { resolveSafeFirstRedirectHop } from "@/lib/redirects/cycle";
import { logRedirectWarn } from "@/lib/redirects/log";
import { isSelfRedirect } from "@/lib/redirects/normalize";
import { assertRedirectSafeToWrite } from "@/lib/redirects/redirect-write-guard";
import { setRedirectCache } from "@/lib/redirects/redis-cache";
import type { ActiveRedirect } from "@/lib/redirects/shared";
import {
  normalizeStoredNewPath,
  normalizeStoredOldPath,
} from "@/lib/redirects/shared";

export type { ActiveRedirect } from "@/lib/redirects/shared";
export { normalizeStoredNewPath, normalizeStoredOldPath } from "@/lib/redirects/shared";

export async function findActiveRedirect(
  rawPath: string
): Promise<ActiveRedirect | null> {
  const oldPath = normalizeStoredOldPath(rawPath);
  if (!oldPath.startsWith("/")) return null;

  const row = await prisma.redirect.findFirst({
    where: { oldPath, isActive: true },
    select: { newPath: true, statusCode: true },
  });

  if (!row?.newPath?.trim()) return null;

  const newPath = normalizeStoredNewPath(row.newPath.trim());

  if (isSelfRedirect(oldPath, newPath)) {
    logRedirectWarn("self-redirect in db ignored", { oldPath, newPath });
    return null;
  }

  const safe = await resolveSafeFirstRedirectHop(oldPath, async (pathname) => {
    if (pathname !== oldPath) {
      const nested = await prisma.redirect.findFirst({
        where: { oldPath: pathname, isActive: true },
        select: { newPath: true, statusCode: true },
      });
      if (!nested?.newPath?.trim()) return null;
      return {
        newPath: normalizeStoredNewPath(nested.newPath.trim()),
        statusCode: nested.statusCode === 302 ? 302 : 301,
      };
    }
    return {
      newPath,
      statusCode: row.statusCode === 302 ? 302 : 301,
    };
  });

  if (!safe) {
    logRedirectWarn("redirect cycle ignored on read", { oldPath, newPath });
    return null;
  }

  const redirect: ActiveRedirect = {
    newPath: safe.newPath,
    statusCode: safe.statusCode === 302 ? 302 : 301,
  };
  await setRedirectCache(oldPath, redirect);
  return redirect;
}

export async function upsertPostDeleteRedirects(
  slug: string,
  categorySlug: string | null | undefined
): Promise<void> {
  const locales: PublicLocale[] = ["zh-TW", "en"];
  for (const locale of locales) {
    const oldPath = normalizeStoredOldPath(postArticlePath(locale, slug));
    const newPath = normalizeStoredNewPath(
      postDeleteRedirectTarget(locale, categorySlug)
    );

    if (!(await assertRedirectSafeToWrite(oldPath, newPath))) {
      continue;
    }

    await prisma.redirect.upsert({
      where: { oldPath },
      create: { oldPath, newPath, statusCode: 301, isActive: true },
      update: { newPath, statusCode: 301, isActive: true },
    });

    const redirect: ActiveRedirect = { newPath, statusCode: 301 };
    await setRedirectCache(oldPath, redirect);
  }
}
