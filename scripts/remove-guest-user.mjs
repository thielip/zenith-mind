/**
 * 軟刪除 GUEST 參訪帳號（預設 guest@gmail.com）。
 * 用法：node scripts/remove-guest-user.mjs
 * 需專案根目錄 .env.local 含 DATABASE_URL。
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
const envPath = join(root, ".env.local");
if (!existsSync(envPath)) {
  console.error("[remove-guest-user] 找不到 .env.local");
  process.exit(1);
}

for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq <= 0) continue;
  const key = t.slice(0, eq).trim();
  let val = t.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  val = val.replace(/\\n/g, "\n");
  process.env[key] = val;
}

const emails = [
  (process.env.GUEST_BOOTSTRAP_EMAIL ?? "guest@gmail.com").trim().toLowerCase(),
  "guest@gmail.com",
];

const prisma = new PrismaClient();

try {
  const targets = await prisma.user.findMany({
    where: {
      deletedAt: null,
      OR: [
        { role: "GUEST" },
        { email: { in: [...new Set(emails)] } },
      ],
    },
    select: { id: true, email: true, role: true },
  });

  if (targets.length === 0) {
    console.log("[remove-guest-user] 無需刪除：找不到未刪除的 GUEST 帳號");
    process.exit(0);
  }

  const now = new Date();
  for (const u of targets) {
    await prisma.user.update({
      where: { id: u.id },
      data: { deletedAt: now },
    });
    console.log(`[remove-guest-user] 已軟刪除: ${u.email} (${u.role}) id=${u.id}`);
  }

  console.log(`[remove-guest-user] 完成，共 ${targets.length} 筆`);
} finally {
  await prisma.$disconnect();
}
