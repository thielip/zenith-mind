import { NextResponse } from "next/server";
import { gateAdminRead } from "@/lib/auth/resolve-admin-action";
import { deriveGcpProjectId } from "@/lib/google/integration-status";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WATCH_KEYS = [
  "REVALIDATE_SECRET",
  "REDIRECT_LOOKUP_SECRET",
  "BIGQUERY_DATASET_ID",
  "GOOGLE_CLOUD_PROJECT_ID",
] as const;

function envPresent(name: string): boolean {
  const v = process.env[name]?.trim();
  return Boolean(v && v.length > 0);
}

/** 管理員用：檢查關鍵 env 是否已注入（不回傳 secret 值） */
export async function GET() {
  const gate = await gateAdminRead();
  if (!gate.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = deriveGcpProjectId();
  const bigqueryMissing: string[] = [];
  if (!envPresent("BIGQUERY_DATASET_ID")) {
    bigqueryMissing.push("BIGQUERY_DATASET_ID");
  }
  if (!projectId) {
    bigqueryMissing.push("GOOGLE_CLOUD_PROJECT_ID（或有效的 GA4_CLIENT_EMAIL）");
  }

  const keys = Object.fromEntries(
    WATCH_KEYS.map((key) => [key, envPresent(key)])
  );

  return NextResponse.json(
    {
    checkedAt: new Date().toISOString(),
    nodeEnv: process.env["NODE_ENV"],
    vercel: Boolean(process.env["VERCEL"]),
    keys,
    bigquery: {
      ok: bigqueryMissing.length === 0,
      missing: bigqueryMissing,
      projectId: projectId ?? null,
    },
    hints: [
      "Vercel 更新環境變數後需重新部署（Redeploy）才會注入執行環境。",
      "確認變數設在 Production，且名稱完全一致（勿有多餘空格）。",
      "REVALIDATE_SECRET 建議 ≥32 字元；可用 openssl rand -hex 32 產生。",
      "作戰中心健康報告快取約 120 秒，請按「重新偵測」或稍候再刷新。",
    ],
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}
