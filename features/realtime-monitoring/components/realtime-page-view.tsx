"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { RealtimePagePayload } from "@/server/command-center/load-realtime";
import { TerminalPanel } from "@/widgets/terminal-stream/terminal-panel";

export function RealtimePageView({ data }: { data: RealtimePagePayload }) {
  return (
    <ModuleShell
      title="即時監控"
      description="即時流量、事件流與系統遙測"
      kpis={data.kpis}
      sections={[{ title: "遙測", content: (
      <ul className="font-mono text-sm text-slate-300"><li>即時使用者: {data.snapshot.liveUsers}</li><li>Redis 命中率: {data.snapshot.cacheHitRate}%</li><li>API 延遲: {data.snapshot.apiLatencyMs}ms</li></ul>
    )}, { title: "終端機", content: <TerminalPanel /> }]}
    />
  );
}
