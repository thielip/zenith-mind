"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { ForecastPayload } from "@/server/command-center/load-forecast";


export function ForecastPageView({ data }: { data: ForecastPayload }) {
  return (
    <ModuleShell
      title="預測中心"
      description="AI 流量與趨勢預測（7 日）"
      kpis={data.kpis}
      sections={[{ title: "7 日預測", content: (
      <ul className="font-mono text-xs text-slate-400">{data.forecast.map((f) => (<li key={f.date} className="py-1">{f.date}: {f.sessions} ({f.lower}-{f.upper})</li>))}</ul>
    )}]}
    />
  );
}
