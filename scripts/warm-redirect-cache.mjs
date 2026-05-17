/**
 * 將 DB 中所有 active redirects 寫入 Upstash Redis（部署後可執行一次）
 * 用法：node scripts/warm-redirect-cache.mjs
 */
import { PrismaClient } from "@prisma/client";
import { Redis } from "@upstash/redis";
import pkg from "@next/env";
pkg.loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const redis = Redis.fromEnv();
const PREFIX = "redirect:v1:";
const MISS = "__MISS__";

try {
  const rows = await prisma.redirect.findMany({
    where: { isActive: true },
    select: { oldPath: true, newPath: true, statusCode: true },
  });

  let count = 0;
  for (const row of rows) {
    if (!row.oldPath || !row.newPath?.trim()) continue;
    const payload = JSON.stringify({
      newPath: row.newPath.trim(),
      statusCode: row.statusCode === 302 ? 302 : 301,
    });
    await redis.set(`${PREFIX}${row.oldPath}`, payload, { ex: 60 * 60 * 24 * 7 });
    count += 1;
  }

  console.log(JSON.stringify({ ok: true, warmed: count, missMarker: MISS }));
} finally {
  await prisma.$disconnect();
}
