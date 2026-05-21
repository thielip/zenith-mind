"use server";

import { z } from "zod";
import { getRequestMeta } from "@/lib/request/request-meta";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";
import {
  changeUserPassword,
  createAdminUser,
  listAdminUsers,
  softDeleteAdminUser,
} from "@/domain/auth/user.service";
import { gateAdminRead, gateAdminWrite } from "@/lib/auth/resolve-admin-action";
import { writeAuditLog } from "@/infrastructure/db/adapters/audit.prisma-adapter";

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8).max(128);

const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128).optional(),
  newPassword: passwordSchema,
  userId: z.string().cuid().optional(),
});

export async function listUsersAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      email: string;
      role: string;
      totpEnabled: boolean;
      createdAt: string;
    }>
  >
> {
  try {
    const gate = await gateAdminRead();
    if (!gate.ok) return gate.result;
    const users = await listAdminUsers();
    return {
      success: true,
      data: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      error: null,
    };
  } catch {
    return { success: false, data: null, error: Errors.auth() };
  }
}

export async function createUserAction(
  input: unknown
): Promise<ActionResult<{ email: string }>> {
  const meta = await getRequestMeta();
  try {
    const gate = await gateAdminWrite("user");
    if (!gate.ok) return gate.result;
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const user = await createAdminUser(parsed.data.email, parsed.data.password);
    void writeAuditLog({
      action: "CREATE",
      metadata: { entity: "user", email: user.email },
      ...meta,
    });
    return { success: true, data: { email: user.email }, error: null };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "DUPLICATE_EMAIL") {
      return { success: false, data: null, error: Errors.duplicate("email") };
    }
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

export async function changePasswordAction(
  input: unknown
): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();
  try {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const gate = await gateAdminWrite("user", parsed.data.userId);
    if (!gate.ok) return gate.result;
    const admin = gate.session;

    const resolvedTargetId = parsed.data.userId ?? admin.userId;
    const isSelf = resolvedTargetId === admin.userId;

    if (!isSelf && parsed.data.userId) {
      // 管理員重設他人密碼，不需舊密碼
      await changeUserPassword(resolvedTargetId, parsed.data.newPassword);
    } else {
      if (!parsed.data.currentPassword) {
        return {
          success: false,
          data: null,
          error: Errors.validation({ currentPassword: ["請輸入目前密碼"] }),
        };
      }
      await changeUserPassword(
        resolvedTargetId,
        parsed.data.newPassword,
        parsed.data.currentPassword
      );
    }

    void writeAuditLog({
      action: "UPDATE",
      metadata: { entity: "user_password", userId: resolvedTargetId, byAdmin: !isSelf },
      ...meta,
    });
    return { success: true, data: undefined, error: null };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "CURRENT_PASSWORD_INVALID") {
      return { success: false, data: null, error: Errors.auth() };
    }
    if (e instanceof Error && e.message === "AUTH") {
      return { success: false, data: null, error: Errors.auth() };
    }
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}

export async function deleteUserAction(
  userId: string
): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();
  try {
    const gate = await gateAdminWrite("user");
    if (!gate.ok) return gate.result;
    const admin = gate.session;
    const id = z.string().cuid().parse(userId);
    if (id === admin.userId) {
      return { success: false, data: null, error: Errors.forbidden() };
    }

    await softDeleteAdminUser(id);
    void writeAuditLog({
      action: "DELETE",
      metadata: { entity: "user", userId: id },
      ...meta,
    });
    return { success: true, data: undefined, error: null };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "LAST_ADMIN") {
      return {
        success: false,
        data: null,
        error: {
          code: "LAST_ADMIN",
          message: "Cannot delete the last admin",
          httpStatus: 400,
          retryable: false,
          severity: "warn",
        },
      };
    }
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}
