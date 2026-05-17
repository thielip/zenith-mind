"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { BusinessPayload } from "@/server/command-center/load-business";


export function BusinessPageView({ data }: { data: BusinessPayload }) {
  return (
    <ModuleShell
      title="商業分析"
      description="漏斗、ROI、Google Ads 與 GA4"
      kpis={data.kpis}
      sections={[{ title: "轉換漏斗", content: (
      <ul className="font-mono text-sm">{data.funnel.map((f) => (<li key={f.stage} className="py-1 text-slate-300">{f.stage}: {f.users}</li>))}</ul>
    )}]}
    />
  );
}
