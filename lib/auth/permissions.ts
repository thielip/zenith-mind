// lib/auth/permissions.ts — 後台實體 × 角色權限對照（Edge / Node 共用）

export type UserRole = "ADMIN" | "GUEST";

/** 後台資源實體（對應 AuditLog entityType 與功能模組） */
export type AdminEntity =
  | "post"
  | "user"
  | "site"
  | "media"
  | "affiliate"
  | "integration"
  | "analytics"
  | "audit"
  | "settings";

export type AdminPermission = "read" | "write";

const ROLE_ENTITY_PERMISSIONS: Record<
  UserRole,
  Record<AdminEntity, readonly AdminPermission[]>
> = {
  ADMIN: {
    post: ["read", "write"],
    user: ["read", "write"],
    site: ["read", "write"],
    media: ["read", "write"],
    affiliate: ["read", "write"],
    integration: ["read", "write"],
    analytics: ["read", "write"],
    audit: ["read", "write"],
    settings: ["read", "write"],
  },
  GUEST: {
    post: ["read"],
    user: ["read"],
    site: ["read"],
    media: ["read"],
    affiliate: ["read"],
    integration: ["read"],
    analytics: ["read"],
    audit: ["read"],
    settings: ["read"],
  },
};

export function hasAdminPermission(
  role: UserRole,
  entity: AdminEntity,
  permission: AdminPermission
): boolean {
  return ROLE_ENTITY_PERMISSIONS[role][entity].includes(permission);
}

export function canWriteAdminEntity(role: UserRole, entity: AdminEntity): boolean {
  return hasAdminPermission(role, entity, "write");
}

export function isGuestRole(role: UserRole): boolean {
  return role === "GUEST";
}
