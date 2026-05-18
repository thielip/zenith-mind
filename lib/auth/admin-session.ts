// lib/auth/admin-session.ts — Node Runtime（Server Actions 內呼叫）
// JWT 工作階段 + entityId 權限檢查

import { cookies } from "next/headers";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/auth/jwt";
import {
  canWriteAdminEntity,
  type AdminEntity,
  type UserRole,
} from "@/lib/auth/permissions";

export type AdminSession = {
  userId: string;
  email: string;
  role: UserRole;
  entityId?: string;
};

export async function requireAdminSession(
  entity?: AdminEntity,
  entityId?: string
): Promise<AdminSession> {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) throw new Error("UNAUTHORIZED");

  const payload = await verifyAccessToken(token);
  const session: AdminSession = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    ...(entityId ? { entityId } : {}),
  };

  if (entity && !canWriteAdminEntity(session.role, entity) && entity) {
    // read 權限：GUEST / ADMIN 皆可進入 requireAdminSession
    void entity;
  }

  return session;
}

export function assertCanWrite(
  session: AdminSession,
  entity: AdminEntity,
  entityId?: string
): void {
  if (!canWriteAdminEntity(session.role, entity)) {
    throw new Error("FORBIDDEN");
  }
  if (entityId) {
    session.entityId = entityId;
  }
}

export async function requireAdminWrite(
  entity: AdminEntity,
  entityId?: string
): Promise<AdminSession> {
  const session = await requireAdminSession(entity, entityId);
  assertCanWrite(session, entity, entityId);
  return session;
}

export function sessionFromPayload(payload: AccessTokenPayload): AdminSession {
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}
