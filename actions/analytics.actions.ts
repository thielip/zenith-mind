// actions/analytics.actions.ts — Node Runtime
// PageView 記錄 Server Action

"use server";

import { headers } from "next/headers";
import { recordPageViewCore } from "@/lib/analytics/record-page-view-core";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

export async function recordPageViewAction(
  input: unknown
): Promise<ActionResult<void>> {
  try {
    const h = await headers();
    const result = await recordPageViewCore(input, h);
    if (!result.ok) {
      if (result.reason === "validation") {
        return { success: false, data: null, error: Errors.validation() };
      }
      return { success: false, data: null, error: Errors.internal() };
    }
    return { success: true, data: undefined, error: null };
  } catch (e: unknown) {
    console.error("[PageView] recordPageView error:", e);
    return { success: false, data: null, error: Errors.internal() };
  }
}
