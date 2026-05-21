/**
 * Cloudflare 公開 Worker 用：避免打包 @prisma/client Query Engine。
 * 僅在 CF_PUBLIC_ONLY 建置時透過 webpack alias 取代 prisma.ts。
 */
import type { PrismaClient } from "@prisma/client";

function unavailable(): never {
  throw new Error(
    "Prisma is not available on the Cloudflare public worker. Use Supabase REST loaders instead."
  );
}

export const prisma = new Proxy({} as PrismaClient, {
  get() {
    return unavailable();
  },
});
