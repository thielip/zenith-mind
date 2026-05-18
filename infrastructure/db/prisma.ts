// infrastructure/db/prisma.ts
// Prisma Client 單例（防止開發環境熱重載產生多個實例）
// ⚠ Node Runtime Only — 禁止在 Edge Middleware 引入
// ⚠ Cloudflare 公開站請用 lib/site/public-site-supabase.ts，勿靜態 import 本檔

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const log =
  process.env["NODE_ENV"] === "development"
    ? (["query", "error", "warn"] as const)
    : (["error"] as const);

function hasAdSlotDelegate(client: PrismaClient): boolean {
  const d = (client as unknown as { adSlot?: { findFirst?: unknown } }).adSlot;
  return typeof d?.findFirst === "function";
}

function getOrCreatePrisma(): PrismaClient {
  const existing = globalForPrisma.prisma;

  const staleDevClient =
    process.env["NODE_ENV"] === "development" &&
    existing &&
    !hasAdSlotDelegate(existing);

  if (staleDevClient) {
    void existing.$disconnect().catch(() => {
      /* ignore */
    });
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ log: [...log] });
  }

  return globalForPrisma.prisma;
}

export const prisma = getOrCreatePrisma();
