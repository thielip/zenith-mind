"use client";

import { memo, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastSeriesPoint } from "@/lib/forecast/forecast-model";

function ForecastTrajectoryChartInner({ data }: { data: ForecastSeriesPoint[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        label: d.label,
        actual: d.actual,
        projected: d.projected,
        confidence:
          d.lower != null && d.upper != null ? [d.lower, d.upper] : null,
      })),
    [data]
  );

  if (chartData.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-400">
        尚無 GA4 歷史資料，無法繪製預測圖表
      </p>
    );
  }

  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
          <YAxis tick={{ fill: "#cbd5e1", fontSize: 11 }} width={44} />
          <Tooltip
            contentStyle={{
              background: "#0B0F19",
              border: "1px solid rgba(139,92,246,0.35)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => {
              if (name === "actual") return [value ?? "—", "實際"];
              if (name === "projected") return [value ?? "—", "預測"];
              return [value, name];
            }}
            labelFormatter={(label) => `日期 ${label}`}
          />
          <Area
            type="monotone"
            dataKey="confidence"
            stroke="none"
            fill="url(#forecastBand)"
            fillOpacity={1}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#00D2FF"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#00D2FF" }}
            connectNulls={false}
            name="actual"
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="#a78bfa"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: "#a78bfa" }}
            connectNulls={false}
            name="projected"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-6 rounded bg-cyan-400" />
          過去 7 日實際
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-6 rounded border border-dashed border-violet-400 bg-violet-400/30" />
          未來預測
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded bg-violet-500/25" />
          信心區間
        </span>
      </div>
    </div>
  );
}

export const ForecastTrajectoryChart = memo(ForecastTrajectoryChartInner);
