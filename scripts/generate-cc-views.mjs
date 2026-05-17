import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const views = [
  {
    slug: "geo",
    feature: "geo-intelligence",
    view: "GeoPageView",
    type: "GeoPayload",
    loader: "load-geo",
    title: "GEO 情報",
    desc: "生成式引擎能見度、Share of Voice 與 AI 引用",
    body: `sections={[{ title: "AI 引擎能見度", content: (
      <table className="w-full text-xs"><thead><tr className="text-slate-500"><th className="pb-2 text-left">引擎</th><th className="pb-2 text-right">能見度</th><th className="pb-2 text-right">SoV</th></tr></thead><tbody>
      {data.engines.map((e) => (<tr key={e.name} className="border-t border-slate-800/60"><td className="py-2 text-slate-200">{e.name}</td><td className="py-2 text-right font-mono">{e.visibility}</td><td className="py-2 text-right font-mono">{e.shareOfVoice}%</td></tr>))}
      </tbody></table>
    )}]}`,
  },
  {
    slug: "aeo",
    feature: "aeo-intelligence",
    view: "AeoPageView",
    type: "AeoPayload",
    loader: "load-aeo",
    title: "AEO 情報",
    desc: "回答引擎優化、Schema 與精選摘要",
    body: `sections={[{ title: "AEO 指標", content: (
      <ul className="space-y-2 font-mono text-sm text-slate-300">{data.metrics.map((m) => (<li key={m.name}>{m.name}: {m.value} {m.unit}</li>))}</ul>
    )}]}`,
  },
  {
    slug: "agents",
    feature: "agent-center",
    view: "AgentsPageView",
    type: "AgentPayload",
    loader: "load-agents",
    title: "Agent 中控",
    desc: "AI Agent 管線、佇列與自動化狀態",
    body: `sections={[{ title: "任務佇列", content: (
      <ul className="font-mono text-xs text-slate-400">{data.queue.slice(0,8).map((q) => (<li key={q.id} className="py-1">{q.type} · {q.status}</li>))}</ul>
    )}]}`,
  },
  {
    slug: "realtime",
    feature: "realtime-monitoring",
    view: "RealtimePageView",
    type: "RealtimePagePayload",
    loader: "load-realtime",
    title: "即時監控",
    desc: "即時流量、事件流與系統遙測",
    body: `sections={[{ title: "遙測", content: (
      <ul className="font-mono text-sm text-slate-300"><li>即時使用者: {data.snapshot.liveUsers}</li><li>Redis 命中率: {data.snapshot.cacheHitRate}%</li><li>API 延遲: {data.snapshot.apiLatencyMs}ms</li></ul>
    )}, { title: "終端機", content: <TerminalPanel /> }]}`,
    extraImport: 'import { TerminalPanel } from "@/widgets/terminal-stream/terminal-panel";',
  },
  {
    slug: "business",
    feature: "business-analytics",
    view: "BusinessPageView",
    type: "BusinessPayload",
    loader: "load-business",
    title: "商業分析",
    desc: "漏斗、ROI、Google Ads 與 GA4",
    body: `sections={[{ title: "轉換漏斗", content: (
      <ul className="font-mono text-sm">{data.funnel.map((f) => (<li key={f.stage} className="py-1 text-slate-300">{f.stage}: {f.users}</li>))}</ul>
    )}]}`,
  },
  {
    slug: "traffic",
    feature: "traffic-intelligence",
    view: "TrafficPageView",
    type: "TrafficPayload",
    loader: "load-traffic",
    title: "流量全景",
    desc: "GA4 趨勢與熱門頁面",
    body: `sections={[{ title: "30 天趨勢", content: <GlowAreaChart data={data.series} /> }, { title: "熱門頁", content: (
      <ul className="text-xs text-slate-400">{data.topPages.map((p) => (<li key={p.path} className="py-1">{p.path} — {p.views}</li>))}</ul>
    )}]}`,
    extraImport: 'import { GlowAreaChart } from "@/widgets/chart-panel/glow-area-chart";',
  },
  {
    slug: "content",
    feature: "content-intelligence",
    view: "ContentPageView",
    type: "ContentPayload",
    loader: "load-content",
    title: "內容情報",
    desc: "內容庫存與 GA4 頁面表現",
    body: `sections={[{ title: "熱門內容", content: (
      <ul className="text-xs">{data.pages.map((p) => (<li key={p.path} className="py-1 text-slate-400">{p.title} ({p.views})</li>))}</ul>
    )}]}`,
  },
  {
    slug: "errors",
    feature: "error-intelligence",
    view: "ErrorsPageView",
    type: "ErrorsPayload",
    loader: "load-errors",
    title: "錯誤追蹤",
    desc: "串接異常與系統錯誤",
    body: `sections={[{ title: "異常項目", content: data.items.length ? (
      <ul className="text-xs text-red-300">{data.items.map((i) => (<li key={i.service} className="py-1">{i.service}: {i.detail ?? i.status}</li>))}</ul>
    ) : <p className="text-sm text-emerald-400">目前無異常服務</p> }]}`,
  },
  {
    slug: "security",
    feature: "security-center",
    view: "SecurityPageView",
    type: "SecurityPayload",
    loader: "load-security",
    title: "安全中心",
    desc: "憑證、串接健康與 BigQuery",
    body: `sections={[{ title: "串接狀態", content: (
      <ul className="max-h-64 overflow-y-auto text-xs">{data.integrations.map((i) => (<li key={i.id} className="flex justify-between border-b border-slate-800/40 py-1"><span>{i.name}</span><span className={i.status === "ok" ? "text-emerald-400" : "text-amber-300"}>{i.status}</span></li>))}</ul>
    )}]}`,
  },
  {
    slug: "forecast",
    feature: "forecast-center",
    view: "ForecastPageView",
    type: "ForecastPayload",
    loader: "load-forecast",
    title: "預測中心",
    desc: "AI 流量與趨勢預測（7 日）",
    body: `sections={[{ title: "7 日預測", content: (
      <ul className="font-mono text-xs text-slate-400">{data.forecast.map((f) => (<li key={f.date} className="py-1">{f.date}: {f.sessions} ({f.lower}-{f.upper})</li>))}</ul>
    )}]}`,
  },
];

for (const v of views) {
  const dir = path.join(root, "features", v.feature, "components");
  fs.mkdirSync(dir, { recursive: true });
  const content = `"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { ${v.type} } from "@/server/command-center/${v.loader}";
${v.extraImport ?? ""}

export function ${v.view}({ data }: { data: ${v.type} }) {
  return (
    <ModuleShell
      title="${v.title}"
      description="${v.desc}"
      kpis={data.kpis}
      ${v.body}
    />
  );
}
`;
  fs.writeFileSync(path.join(dir, `${v.slug}-page-view.tsx`), content);
}

console.log("views ok", views.length);
