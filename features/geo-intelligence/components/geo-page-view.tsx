"use client";
import { ModuleShell } from "@/widgets/command-shell/module-shell";
import type { GeoPayload } from "@/server/command-center/load-geo";
import { DemoBanner } from "@/shared/ui/demo-banner";

export function GeoPageView({ data }: { data: GeoPayload }) {
  return (
    <ModuleShell
      title="GEO 情報"
      description="生成式引擎能見度、Share of Voice 與 AI 引用"
      kpis={data.kpis}
      headerExtra={
        data.isDemo ? (
          <DemoBanner
            title="Demo 示範資料 / 待接 API"
            description="目前各 AI 引擎能見度為靜態示範值，尚未連接 Otterly、Semrush AI Visibility 等第三方 GEO 監測服務。接上 API 後此區將顯示即時數據。"
          />
        ) : null
      }
      sections={[
        {
          title: "AI 引擎能見度",
          content: (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-2 text-left">引擎</th>
                  <th className="pb-2 text-right">能見度</th>
                  <th className="pb-2 text-right">SoV</th>
                </tr>
              </thead>
              <tbody>
                {data.engines.map((e) => (
                  <tr key={e.name} className="border-t border-slate-800/60">
                    <td className="py-2 text-slate-200">{e.name}</td>
                    <td className="py-2 text-right font-mono">{e.visibility}</td>
                    <td className="py-2 text-right font-mono">{e.shareOfVoice}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ),
        },
      ]}
    />
  );
}
