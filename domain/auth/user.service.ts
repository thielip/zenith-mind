import { prisma } from "@/infrastructure/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  totpEnabled: boolean;
  createdAt: Date;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      role: true,
      totpEnabled: true,
      createdAt: true,
    },
  });
}

export async function createAdminUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { email: normalized },
  });
  if (existing && !existing.deletedAt) {
    throw new Error("DUPLICATE_EMAIL");
  }

  const passwordHash = await hashPassword(password);
  if (existing?.deletedAt) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        email: normalized,
        password: passwordHash,
        role: "ADMIN",
        deletedAt: null,
        totpEnabled: false,
        totpSecret: null,
        totpVerifiedAt: null,
      },
      select: { id: true, email: true },
    });
  }

  return prisma.user.create({
    data: {
      email: normalized,
      password: passwordHash,
      role: "ADMIN",
    },
    select: { id: true, email: true },
  });
}

export async function changeUserPassword(
  userId: string,
  newPassword: string,
  currentPassword?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  if (currentPassword !== undefined) {
    const ok = await verifyPassword(currentPassword, user.password);
    if (!ok) throw new Error("CURRENT_PASSWORD_INVALID");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { password: await hashPassword(newPassword) },
  });
}

export async function softDeleteAdminUser(userId: string) {
  const activeCount = await prisma.user.count({ where: { deletedAt: null } });
  if (activeCount <= 1) throw new Error("LAST_ADMIN");

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
}
