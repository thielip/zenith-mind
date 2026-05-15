import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

try {
  const databaseUrl = new URL(process.env.DATABASE_URL);
  const rows = await prisma.$queryRawUnsafe(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('site_settings', 'hero_slides', 'home_carousel_items', 'posts')
    order by table_name
  `);

  const counts = {
    siteSettings: await prisma.siteSettings.count(),
    heroSlides: await prisma.heroSlide.count(),
    homeCarouselItems: await prisma.homeCarouselItem.count(),
    posts: await prisma.post.count(),
    publishedPosts: await prisma.post.count({
      where: { status: "PUBLISHED", deletedAt: null },
    }),
  };

  console.log(JSON.stringify({
    databaseHost: databaseUrl.host,
    databaseName: databaseUrl.pathname.slice(1),
    foundTables: rows.map((row) => row.table_name),
    counts,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
