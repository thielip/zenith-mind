/** Edge-safe 共用型別與路徑正規化（不可 import prisma） */
import { parseRedirectPath } from "@/lib/redirects/normalize";

export type ActiveRedirect = {
  newPath: string;
  statusCode: number;
};

export function normalizeStoredOldPath(path: string): string {
  return parseRedirectPath(path).pathname;
}

export function normalizeStoredNewPath(path: string): string {
  const { pathname, search } = parseRedirectPath(path);
  return `${pathname}${search}`;
}
