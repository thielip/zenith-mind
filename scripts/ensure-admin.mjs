import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/ensure-admin.mjs <email> <password>");
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      password: passwordHash,
      role: "ADMIN",
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
    },
    update: {
      password: passwordHash,
      role: "ADMIN",
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
      password: true,
    },
  });

  const verified = await bcrypt.compare(password, user.password);
  if (!verified) {
    throw new Error("Password verification failed after upsert.");
  }

  console.log(JSON.stringify({
    ok: true,
    email: user.email,
    role: user.role,
    totpEnabled: user.totpEnabled,
  }));
} finally {
  await prisma.$disconnect();
}
