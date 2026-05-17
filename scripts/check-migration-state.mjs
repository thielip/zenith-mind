import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

try {
  const postCols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='posts'
      AND column_name IN ('coverImageWidth','contentBlocks','contentDoc')
    ORDER BY column_name`);
  const adSlots = await prisma.$queryRawUnsafe(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema='public' AND table_name='ad_slots'
    ) AS ok`);
  const integration = await prisma.$queryRawUnsafe(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema='public' AND table_name='integration_credentials'
    ) AS table_ok,
    EXISTS (
      SELECT 1 FROM pg_type WHERE typname='IntegrationConnectionStatus'
    ) AS enum_ok`);
  const migrations = await prisma.$queryRawUnsafe(`
    SELECT migration_name, finished_at, rolled_back_at,
           LEFT(logs, 200) AS logs_preview
    FROM _prisma_migrations
    ORDER BY started_at`);
  console.log(
    JSON.stringify(
      { postCols, adSlots: adSlots[0], integration: integration[0], migrations },
      null,
      2
    )
  );
} finally {
  await prisma.$disconnect();
}
