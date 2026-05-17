"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { TrafficPayload } from "@/server/command-center/load-traffic";
import { GlowAreaChart } from "@/widgets/chart-panel/glow-area-chart";
import { listKey } from "@/shared/lib/list-key";

export function TrafficPageView({ data }: { data: TrafficPayload }) {
  return (
    <ModuleShell
      title="流量全景"
      description="GA4 趨勢與熱門頁面"
      kpis={data.kpis}
      sections={[{ title: "30 天趨勢", content: <GlowAreaChart data={data.series} /> }, { title: "熱門頁", content: (
      <ul className="text-xs text-slate-400">{data.topPages.map((p, i) => (<li key={listKey([p.path, p.title, p.views], i)} className="py-1">{p.path} — {p.views}</li>))}</ul>
    )}]}
    />
  );
}
