import type { Prisma } from "@prisma/client";

/**
 * 公開文章可見性（Prisma / Supabase 對稱）
 * - 排除 DRAFT / SCHEDULED / ARCHIVED（僅 PUBLISHED）
 * - 排除軟刪除
 * - 排除 publishedAt 在未來的「已發布」文章（手動設未來時間時）
 */
export function prismaPublishedPostWhere(now = new Date()): Prisma.PostWhereInput {
  return {
    status: "PUBLISHED",
    deletedAt: null,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };
}

export function mergePrismaPublishedWhere(
  extra: Prisma.PostWhereInput,
  now = new Date()
): Prisma.PostWhereInput {
  return { AND: [prismaPublishedPostWhere(now), extra] };
}

/** PostgREST and=(...,or(publishedAt.is.null,publishedAt.lte.<iso>)) */
export function supabasePublishedVisibilityAnd(now = new Date()): string {
  const iso = now.toISOString();
  return `(status.eq.PUBLISHED,deletedAt.is.null,or(publishedAt.is.null,publishedAt.lte.${iso}))`;
}

/** 在可見性 and 內追加其他 and 條件（例如全文 or） */
export function supabasePublishedVisibilityAndWith(
  extraParts: string[],
  now = new Date()
): string {
  const iso = now.toISOString();
  const inner = [
    "status.eq.PUBLISHED",
    "deletedAt.is.null",
    `or(publishedAt.is.null,publishedAt.lte.${iso})`,
    ...extraParts,
  ];
  return `(${inner.join(",")})`;
}
