import prismaPkg from "@prisma/client";
import nextEnv from "@next/env";

const { PrismaClient } = prismaPkg;
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const categories = [
  { slug: "international", name: "國際視野", nameEn: "Global Perspectives", oldSlugs: ["real-estate"] },
  { slug: "finance", name: "金融世界", nameEn: "Finance World", oldSlugs: ["quant"] },
  { slug: "ai-tech", name: "AI科技", nameEn: "AI Technology", oldSlugs: ["ai-tech"] },
  { slug: "education", name: "知識教育", nameEn: "Knowledge Education", oldSlugs: ["education"] },
  { slug: "lifestyle", name: "生活玩家", nameEn: "Lifestyle Players", oldSlugs: ["travel"] },
  { slug: "other", name: "其他", nameEn: "Other", oldSlugs: ["ai-creation"] },
];

async function main() {
  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { slug: { in: [category.slug, ...category.oldSlugs] } },
      orderBy: { createdAt: "asc" },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          slug: category.slug,
          name: category.name,
          nameEn: category.nameEn,
          deletedAt: null,
        },
      });
    } else {
      await prisma.category.create({
        data: {
          slug: category.slug,
          name: category.name,
          nameEn: category.nameEn,
        },
      });
    }
  }

  const desiredSlugs = categories.map((category) => category.slug);
  await prisma.category.updateMany({
    where: { slug: { notIn: desiredSlugs }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Default categories synced.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
