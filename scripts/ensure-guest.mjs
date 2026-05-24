import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import pkg from "@next/env";

pkg.loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const email = (process.argv[2] ?? process.env.GUEST_BOOTSTRAP_EMAIL ?? "guest@gmail.com")
  .trim()
  .toLowerCase();
const password = process.argv[3] ?? process.env.GUEST_BOOTSTRAP_PASSWORD ?? "guest123";

if (!email || !password) {
  console.error("Usage: node scripts/ensure-guest.mjs [email] [password]");
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      password: passwordHash,
      role: "GUEST",
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
    },
    update: {
      password: passwordHash,
      role: "GUEST",
      deletedAt: null,
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      totpEnabled: true,
      deletedAt: true,
      password: true,
    },
  });

  const verified = await bcrypt.compare(password, user.password);
  if (!verified) throw new Error("Password verification failed after upsert.");

  console.log(
    JSON.stringify({
      ok: true,
      id: user.id,
      email: user.email,
      role: user.role,
      totpEnabled: user.totpEnabled,
      deletedAt: user.deletedAt,
    })
  );
} finally {
  await prisma.$disconnect();
}
