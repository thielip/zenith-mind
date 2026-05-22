/**
 * Cloudflare Worker 專用 Prisma（Driver Adapter + Neon HTTP，不載入本機 Query Engine）。
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client/edge";

const globalForPrisma = globalThis as unknown as {
  prismaCfEdge: PrismaClient | undefined;
};

function readConnectionString(): string | null {
  try {
    const { env } = getCloudflareContext();
    const bindings = env as Record<string, string | undefined>;
    const fromBinding =
      bindings["DIRECT_URL"]?.trim() || bindings["DATABASE_URL"]?.trim();
    if (fromBinding) return fromBinding;
  } catch {
    /* 非 Worker 請求上下文 */
  }

  return (
    process.env["DIRECT_URL"]?.trim() ||
    process.env["DATABASE_URL"]?.trim() ||
    null
  );
}

export function getPrismaCfEdge(): PrismaClient | null {
  const connectionString = readConnectionString();
  if (!connectionString) return null;

  if (!globalForPrisma.prismaCfEdge) {
    const adapter = new PrismaNeon({ connectionString });
    globalForPrisma.prismaCfEdge = new PrismaClient({ adapter });
  }

  return globalForPrisma.prismaCfEdge;
}
