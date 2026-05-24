import { prisma } from "@/infrastructure/db/prisma";
import { hashPassword } from "@/lib/auth/password";

const DEFAULT_GUEST_EMAIL = "guest@gmail.com";

/** 登入欄位可填 guest，對應參訪帳號信箱 */
export function normalizeLoginEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized === "guest") return DEFAULT_GUEST_EMAIL;
  return normalized;
}

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

/** 確保存在參訪帳號（預設 guest@gmail.com / guest123，登入可填 guest） */
export async function seedGuestUserIfMissing(): Promise<boolean> {
  const email = (
    process.env["GUEST_BOOTSTRAP_EMAIL"] ?? DEFAULT_GUEST_EMAIL
  )
    .trim()
    .toLowerCase();
  const password = process.env["GUEST_BOOTSTRAP_PASSWORD"] ?? "guest123";

  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (existing) return false;

  await prisma.user.create({
    data: {
      email,
      password: await hashPassword(password),
      role: "GUEST",
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
    },
  });
  return true;
}
