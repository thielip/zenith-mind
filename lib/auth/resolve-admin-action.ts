import { requireAdminSession, requireAdminWrite, type AdminSession } from "@/lib/auth/admin-session";
import type { AdminEntity } from "@/lib/auth/permissions";
import { Errors } from "@/domain/shared/core.types";
import type { ActionError, ActionResult } from "@/domain/shared/core.types";

export type AdminActionGate =
  | { ok: true; session: AdminSession }
  | { ok: false; result: ActionResult<never> };

export async function gateAdminRead(): Promise<AdminActionGate> {
  try {
    const session = await requireAdminSession();
    return { ok: true, session };
  } catch {
    return { ok: false, result: { success: false, data: null, error: Errors.auth() } };
  }
}

export async function gateAdminWrite(
  entity: AdminEntity,
  entityId?: string
): Promise<AdminActionGate> {
  try {
    const session = await requireAdminWrite(entity, entityId);
    return { ok: true, session };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return {
        ok: false,
        result: { success: false, data: null, error: Errors.forbidden() },
      };
    }
    return { ok: false, result: { success: false, data: null, error: Errors.auth() } };
  }
}

export function forbiddenResult(): { success: false; data: null; error: ActionError } {
  return { success: false, data: null, error: Errors.forbidden() };
}
