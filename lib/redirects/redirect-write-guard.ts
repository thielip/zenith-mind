import { prisma } from "@/infrastructure/db/prisma";
import { wouldCreateRedirectCycle } from "@/lib/redirects/cycle";
import { logRedirectWarn } from "@/lib/redirects/log";
import {
  isSelfRedirect,
  parseRedirectPath,
} from "@/lib/redirects/normalize";

function normalizeStoredOldPath(path: string): string {
  return parseRedirectPath(path).pathname;
}

function normalizeStoredNewPath(path: string): string {
  const { pathname, search } = parseRedirectPath(path);
  return `${pathname}${search}`;
}

async function lookupActiveNewPath(
  pathname: string
): Promise<{ newPath: string } | null> {
  const oldPath = normalizeStoredOldPath(pathname);
  const row = await prisma.redirect.findFirst({
    where: { oldPath, isActive: true },
    select: { newPath: true },
  });
  if (!row?.newPath?.trim()) return null;
  return { newPath: normalizeStoredNewPath(row.newPath.trim()) };
}

/** DB 寫入前：阻擋 self / A↔B / 鏈式循環 */
export async function assertRedirectSafeToWrite(
  oldPath: string,
  newPath: string
): Promise<boolean> {
  const normalizedOld = normalizeStoredOldPath(oldPath);
  const normalizedNew = normalizeStoredNewPath(newPath);

  if (isSelfRedirect(normalizedOld, normalizedNew)) {
    logRedirectWarn("skip self-redirect write", {
      oldPath: normalizedOld,
      newPath: normalizedNew,
    });
    return false;
  }

  const cycle = await wouldCreateRedirectCycle(
    normalizedOld,
    normalizedNew,
    lookupActiveNewPath
  );

  if (cycle) {
    logRedirectWarn("skip redirect cycle write", {
      oldPath: normalizedOld,
      newPath: normalizedNew,
    });
    return false;
  }

  return true;
}
