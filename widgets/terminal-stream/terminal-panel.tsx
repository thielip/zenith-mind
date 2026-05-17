"use client";

import { memo } from "react";
import { useRealtimeStream } from "@/hooks/use-realtime-stream";
import { useCommandUiStore } from "@/stores/command-ui-store";
import { GlassCard } from "@/shared/ui/glass-card";

function TerminalPanelInner() {
  useRealtimeStream();
  const lines = useCommandUiStore((s) => s.terminalLines);

  return (
    <GlassCard className="overflow-hidden">
      <div className="border-b border-slate-800/80 px-4 py-2 font-mono text-xs text-cyan-400/80">
        即時終端機 @zenith-mind — 事件串流 (SSE)
      </div>
      <pre
        className="h-48 overflow-y-auto bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-emerald-300/90"
        aria-live="polite"
      >
        {lines.length === 0
          ? "> 等待即時事件…\n"
          : lines.map((line) => `> ${line}\n`).join("")}
      </pre>
    </GlassCard>
  );
}

export const TerminalPanel = memo(TerminalPanelInner);
