"use client";

import { memo, useEffect, useRef } from "react";
import { useRealtimeStream } from "@/hooks/use-realtime-stream";
import { useCommandUiStore } from "@/stores/command-ui-store";
import { GlassCard } from "@/shared/ui/glass-card";

const MOCK_LOGS = [
  "[GA4] 擷取 Data API 成功 · sessions bundle",
  "[GSC] 同步 searchAppearance · 28D",
  "[SEO] 關鍵字維度快取更新",
  "[系統] 串接健康探測 · 21/21 OK",
  "[Gemini] 洞察佇列空閒 · 監控中",
  "[Redis] Upstash 快取命中",
  "[Cron] 排程發布檢查完成",
];

function TerminalPanelInner() {
  useRealtimeStream();
  const lines = useCommandUiStore((s) => s.terminalLines);
  const pushLine = useCommandUiStore((s) => s.pushTerminalLine);
  const preRef = useRef<HTMLPreElement>(null);
  const mockIndex = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      const msg = MOCK_LOGS[mockIndex.current % MOCK_LOGS.length] ?? MOCK_LOGS[0];
      mockIndex.current += 1;
      if (msg) pushLine(msg);
    }, 4500);
    return () => clearInterval(id);
  }, [pushLine]);

  useEffect(() => {
    const el = preRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const display =
    lines.length === 0
      ? "> 等待即時事件…\n"
      : lines.map((line) => `> ${line}\n`).join("");

  return (
    <GlassCard className="overflow-hidden">
      <div className="border-b border-slate-800/80 px-4 py-2 font-mono text-xs text-cyan-400/80">
        即時終端機 @zenith-mind — 事件串流 (SSE)
        <span className="ml-2 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
      </div>
      <pre
        ref={preRef}
        className="h-52 overflow-y-auto bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-emerald-300/90 scroll-smooth"
        aria-live="polite"
      >
        {display}
      </pre>
    </GlassCard>
  );
}

export const TerminalPanel = memo(TerminalPanelInner);
