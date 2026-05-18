// app/api/revalidate/route.ts — Node Runtime
// On-demand ISR 觸發（Bearer Token 驗證，防未授權觸發）

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── Bearer Token 驗證（timing-safe）─────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token      = authHeader.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const expectedSecret = process.env["REVALIDATE_SECRET"] ?? process.env["WEBHOOK_SECRET"];
    if (!expectedSecret) {
      return NextResponse.json({ error: "REVALIDATE_SECRET_REQUIRED" }, { status: 401 });
    }

    const tokenBuf    = Buffer.from(token);
    const expectedBuf = Buffer.from(expectedSecret);

    const isValid =
      tokenBuf.length === expectedBuf.length &&
      timingSafeEqual(tokenBuf, expectedBuf);

    if (!isValid) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
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
      return NextResponse.json({ error: "MISSING_VALUE" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.value || typeof item.value !== "string") continue;
      if (item.type === "tag") {
        revalidateTag(item.value);
      } else {
        revalidatePath(item.value);
      }
    }

    return NextResponse.json({
      success: true,
      revalidated: items.map((i) => i.value),
    });

  } catch (e: unknown) {
    console.error("[Revalidate] Error:", e);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
