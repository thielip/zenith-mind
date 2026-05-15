import { Prisma } from "@prisma/client";

/** 資料庫尚未跑 migration、Prisma schema 已含新欄位時會出現 P2022 */
export function isPrismaMissingColumnError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022";
}
