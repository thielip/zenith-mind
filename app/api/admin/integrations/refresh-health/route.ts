import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { gateAdminOnly } from "@/lib/auth/resolve-admin-action";
import { runIntegrationHealthChecks } from "@/lib/admin/integration-health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 清除作戰中心健康快取並立即重跑探測（Vercel 更新 env 後使用） */
export async function POST() {
  const gate = await gateAdminOnly();
  if (!gate.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("cc-health");
  revalidateTag("cc-integrations");

  const report = await runIntegrationHealthChecks();

  const watch = ["revalidate", "redirect", "google-bigquery"] as const;
  const focused = report.items.filter((i) =>
    watch.includes(i.id as (typeof watch)[number])
  );

  return NextResponse.json({
    checkedAt: report.checkedAt,
    summary: report.summary,
    focused: focused.map((i) => ({
      id: i.id,
      name: i.name,
      status: i.status,
      missing: i.missing,
      detail: i.detail,
    })),
  });
}
