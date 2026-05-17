"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { ContentPayload } from "@/server/command-center/load-content";
import { listKey } from "@/shared/lib/list-key";


export function ContentPageView({ data }: { data: ContentPayload }) {
  return (
    <ModuleShell
      title="內容情報"
      description="內容庫存與 GA4 頁面表現"
      kpis={data.kpis}
      sections={[{ title: "熱門內容", content: (
      <ul className="text-xs">{data.pages.map((p, i) => (<li key={listKey([p.path, p.title, p.views], i)} className="py-1 text-slate-400">{p.title} ({p.views})</li>))}</ul>
    )}]}
    />
  );
}
