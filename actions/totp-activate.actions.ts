// actions/totp-activate.actions.ts — Node Runtime
// TOTP 啟用 Action（驗證後才寫入 DB）

"use server";

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { getRequestMeta } from "@/lib/request/request-meta";
import { verifyTotpToken } from "@/lib/auth/totp";
import { gateAdminWrite } from "@/lib/auth/resolve-admin-action";
import { writeAuditLog } from "@/infrastructure/db/adapters/audit.prisma-adapter";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

const schema = z.object({
  userId:          z.string().cuid(),
  encryptedSecret: z.string().min(32),
  code:            z.string().length(6).regex(/^\d{6}$/),
});

export async function activateTotpAction(
  input: unknown
): Promise<ActionResult<void>> {
  const meta = await getRequestMeta();

  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation(parsed.error.flatten()) };
    }

    const { userId, encryptedSecret, code } = parsed.data;
    const gate = await gateAdminWrite("settings", userId);
    if (!gate.ok) {
      void writeAuditLog({
        action: "TOTP_SETUP",
        userId,
        metadata: { step: "failed", reason: "unauthorized_user" },
        ...meta,
      });
      return gate.result;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, totpEnabled: true },
    });
    if (!user) return { success: false, data: null, error: Errors.auth() };
    if (user.totpEnabled) return { success: true, data: undefined, error: null };

    // 驗證 TOTP code（確保 App 設定正確）
    const isValid = verifyTotpToken(encryptedSecret, code);
    if (!isValid) {
      void writeAuditLog({
        action:   "TOTP_SETUP",
        userId,
        metadata: { step: "failed", reason: "invalid_code" },
        ...meta,
      });
      return { success: false, data: null, error: Errors.totpInvalid() };
    }

    // 驗證成功 → 寫入 DB 啟用 TOTP
    await prisma.user.update({
      where: { id: userId },
      data:  {
        totpSecret:    encryptedSecret,
        totpEnabled:   true,
        totpVerifiedAt: new Date(),
      },
    });

    void writeAuditLog({
      action:   "TOTP_SETUP",
      userId,
      metadata: { step: "success" },
      ...meta,
    });

    return { success: true, data: undefined, error: null };

  } catch (e: unknown) {
    console.error(`[TOTP] activate error [${meta.requestId}]:`, e);
    return { success: false, data: null, error: Errors.internal(meta.requestId) };
  }
}
