"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { SecurityPayload } from "@/server/command-center/load-security";


export function SecurityPageView({ data }: { data: SecurityPayload }) {
  return (
    <ModuleShell
      title="安全中心"
      description="憑證、串接健康與 BigQuery"
      kpis={data.kpis}
      sections={[{ title: "串接狀態", content: (
      <ul className="max-h-64 overflow-y-auto text-xs">{data.integrations.map((i) => (<li key={i.id} className="flex justify-between border-b border-slate-800/40 py-1"><span>{i.name}</span><span className={i.status === "ok" ? "text-emerald-400" : "text-amber-300"}>{i.status}</span></li>))}</ul>
    )}]}
    />
  );
}
