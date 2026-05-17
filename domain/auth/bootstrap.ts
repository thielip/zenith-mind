import { prisma } from "@/infrastructure/db/prisma";
import { hashPassword } from "@/lib/auth/password";

/** 資料庫尚無管理員時，以環境變數建立首位帳號（僅首次） */
export async function seedBootstrapAdminIfEmpty(): Promise<boolean> {
  const count = await prisma.user.count({ where: { deletedAt: null } });
  if (count > 0) return false;

  const email = process.env["ADMIN_BOOTSTRAP_EMAIL"]?.trim().toLowerCase();
  const password = process.env["ADMIN_BOOTSTRAP_PASSWORD"];
  if (!email || !password) return false;

  await prisma.user.create({
    data: {
      email,
      password: await hashPassword(password),
      role: "ADMIN",
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
    },
  });
  return true;
}
