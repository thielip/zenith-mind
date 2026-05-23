// app/api/revalidate/route.ts — Node Runtime
// On-demand ISR 觸發（Bearer Token 驗證，防未授權觸發）

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { timingSafeEqual } from "crypto";
import { applyBaselineSecurityHeaders } from "@/lib/middleware/apply-baseline-security-headers";
import { assertRevalidateTarget } from "@/lib/security/revalidate-target";

export const dynamic = "force-dynamic";

function jsonResponse(
  body: Record<string, unknown>,
  status: number
): NextResponse {
  const res = NextResponse.json(body, { status });
  applyBaselineSecurityHeaders(res.headers);
  return res;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── Bearer Token 驗證（timing-safe）─────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token      = authHeader.replace("Bearer ", "");

    if (!token) {
      return jsonResponse({ error: "UNAUTHORIZED" }, 401);
    }

    const expectedSecret = process.env["REVALIDATE_SECRET"]?.trim();
    if (!expectedSecret) {
      return jsonResponse({ error: "REVALIDATE_SECRET_REQUIRED" }, 401);
    }

    const tokenBuf    = Buffer.from(token);
    const expectedBuf = Buffer.from(expectedSecret);

    const isValid =
      tokenBuf.length === expectedBuf.length &&
      timingSafeEqual(tokenBuf, expectedBuf);

    if (!isValid) {
      return jsonResponse({ error: "UNAUTHORIZED" }, 401);
    }

    // ── 解析目標 ────────────────────────────────────────
    const body = await req.json() as {
      type?: "path" | "tag";
      value?: string;
      items?: Array<{ type: "path" | "tag"; value: string }>;
    };

    const items =
      Array.isArray(body.items) && body.items.length > 0
        ? body.items
        : body.value && typeof body.value === "string"
          ? [{ type: body.type ?? "path", value: body.value }]
          : [];

    if (items.length === 0) {
      return jsonResponse({ error: "MISSING_VALUE" }, 400);
    }

    const revalidated: string[] = [];
    for (const item of items) {
      if (!item.value || typeof item.value !== "string") continue;
      const type = item.type === "tag" ? "tag" : "path";
      if (!assertRevalidateTarget(type, item.value)) {
        return jsonResponse({ error: "INVALID_TARGET", target: item.value }, 400);
      }
      if (type === "tag") {
        revalidateTag(item.value);
      } else {
        revalidatePath(item.value);
      }
      revalidated.push(item.value);
    }

    return jsonResponse({
      success: true,
      revalidated,
    }, 200);

  } catch (e: unknown) {
    console.error("[Revalidate] Error:", e);
    return jsonResponse({ error: "INTERNAL_ERROR" }, 500);
  }
}
