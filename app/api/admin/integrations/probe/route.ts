import { NextRequest, NextResponse } from "next/server";
import { gateAdminOnly } from "@/lib/auth/resolve-admin-action";
import {
  probeDatabase,
  probeGa4Reporting,
  probeGemini,
  probeGoogleAdsOAuth,
  probeRedis,
  probeSearchConsole,
  probeSupabaseStorage,
  type ProbeResult,
} from "@/infrastructure/health/probes";

export const dynamic = "force-dynamic";

const PROBES: Record<string, () => Promise<ProbeResult>> = {
  postgres: probeDatabase,
  redis: probeRedis,
  "supabase-admin": probeSupabaseStorage,
  gemini: probeGemini,
  "ga4-reporting": probeGa4Reporting,
  "google-ads-oauth": probeGoogleAdsOAuth,
  "search-console-live": probeSearchConsole,
};

export async function POST(req: NextRequest) {
  const gate = await gateAdminOnly();
  if (!gate.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let id: string | undefined;
  try {
    const body = (await req.json()) as { id?: string };
    id = body.id;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const probe = id ? PROBES[id] : undefined;
  if (!probe) {
    return NextResponse.json({ error: "Unknown integration id" }, { status: 400 });
  }

  const result = await probe();
  return NextResponse.json({
    id,
    ok: result.ok,
    message: result.message,
    checkedAt: new Date().toISOString(),
  });
}
