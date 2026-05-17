"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { AgentPayload } from "@/server/command-center/load-agents";


export function AgentsPageView({ data }: { data: AgentPayload }) {
  return (
    <ModuleShell
      title="Agent 中控"
      description="AI Agent 管線、佇列與自動化狀態"
      kpis={data.kpis}
      sections={[{ title: "任務佇列", content: (
      <ul className="font-mono text-xs text-slate-400">{data.queue.slice(0,8).map((q) => (<li key={q.id} className="py-1">{q.type} · {q.status}</li>))}</ul>
    )}]}
    />
  );
}
