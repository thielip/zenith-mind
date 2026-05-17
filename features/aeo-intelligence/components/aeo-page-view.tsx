"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { AeoPayload } from "@/server/command-center/load-aeo";
import { DemoBanner } from "@/shared/ui/demo-banner";

export function AeoPageView({ data }: { data: AeoPayload }) {
  return (
    <ModuleShell
      title="AEO 情報"
      description="回答引擎優化、Schema 與站內 FAQ 結構化覆蓋"
      kpis={data.kpis}
      headerExtra={
        <DemoBanner
          title="站內真實指標 + 部分示範"
          description="FAQ 覆蓋率與 SEO Meta 覆蓋來自已發布文章（Prisma 即時計算）。Featured Snippets / Rich Results 仍為示範，待接 Search Console 或第三方 API。"
          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
        />
      }
      sections={[
        {
          title: "AEO 指標",
          content: (
            <ul className="space-y-2 font-mono text-sm text-slate-300">
              {data.metrics.map((m) => (
                <li key={m.name} className="flex flex-wrap items-center gap-2">
                  <span>
                    {m.name}: {m.value} {m.unit}
                  </span>
                  <span
                    className={
                      m.source === "live"
                        ? "rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300"
                        : "rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300"
                    }
                  >
                    {m.source === "live" ? "站內真實" : "示範"}
                  </span>
                </li>
              ))}
            </ul>
          ),
        },
      ]}
    />
  );
}
