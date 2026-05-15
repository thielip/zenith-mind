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
    };

    const { type = "path", value } = body;

    if (!value || typeof value !== "string") {
      return NextResponse.json({ error: "MISSING_VALUE" }, { status: 400 });
    }

    if (type === "tag") {
      revalidateTag(value);
    } else {
      revalidatePath(value);
    }

    return NextResponse.json({ success: true, revalidated: value });

  } catch (e: unknown) {
    console.error("[Revalidate] Error:", e);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
