// actions/analytics.actions.ts — Node Runtime
// PageView 記錄 Server Action

"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { prisma } from "@/infrastructure/db/prisma";
import type { ActionResult } from "@/domain/shared/core.types";
import { Errors } from "@/domain/shared/core.types";

const schema = z.object({
  postId: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().cuid().optional()
  ),
  locale: z.string().max(10).default("zh-TW"),
  referer: z.string().max(500).optional(),
});

export async function recordPageViewAction(
  input: unknown
): Promise<ActionResult<void>> {
  try {
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, data: null, error: Errors.validation() };
    }

    const h         = await headers();
    const ip        = h.get("CF-Connecting-IP") ?? "unknown";
    const ua        = h.get("user-agent") ?? "";
    const salt = process.env["PAGEVIEW_HASH_SALT"];
    if (!salt && process.env["NODE_ENV"] === "production") {
      console.error("[Analytics] PAGEVIEW_HASH_SALT is required in production");
      return { success: false, data: null, error: Errors.internal() };
    }
    const hashSalt = salt ?? "zenith-dev-only";

    // SHA-256(IP + UA + 鹽)，GDPR 相容
    const visitorHash = createHash("sha256")
      .update(`${ip}${ua}${hashSalt}`)
      .digest("hex");

    void prisma.pageView.create({
      data: {
        postId:      parsed.data.postId,
        locale:      parsed.data.locale,
        referer:     parsed.data.referer ?? null,
        visitorHash,
      },
    }).catch((err: unknown) => {
      console.error("[PageView] write failed:", err);
    });

    return { success: true, data: undefined, error: null };

  } catch (e: unknown) {
    console.error("[PageView] recordPageView error:", e);
    return { success: false, data: null, error: Errors.internal() };
  }
}
