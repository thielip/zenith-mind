"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { ErrorsPayload } from "@/server/command-center/load-errors";


export function ErrorsPageView({ data }: { data: ErrorsPayload }) {
  return (
    <ModuleShell
      title="錯誤追蹤"
      description="串接異常與系統錯誤"
      kpis={data.kpis}
      sections={[{ title: "異常項目", content: data.items.length ? (
      <ul className="text-xs text-red-300">{data.items.map((i) => (<li key={i.service} className="py-1">{i.service}: {i.detail ?? i.status}</li>))}</ul>
    ) : <p className="text-sm text-emerald-400">目前無異常服務</p> }]}
    />
  );
}
