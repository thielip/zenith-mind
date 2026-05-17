"use client";

import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ChartPoint {
  date: string;
  sessions: number;
  pageViews: number;
}

function GlowAreaChartInner({ data }: { data: ChartPoint[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: d.date.length >= 8 ? d.date.slice(4, 6) + "/" + d.date.slice(6, 8) : d.date,
      })),
    [data]
  );

  if (chartData.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        尚無流量數據（GA4 API 未回傳或無數據）
      </p>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="ccSessions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D2FF" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#00D2FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={40} />
          <Tooltip
            contentStyle={{
              background: "#0B0F19",
              border: "1px solid rgba(0,210,255,0.25)",
              borderRadius: 8,
            }}
          />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="#00D2FF"
            fill="url(#ccSessions)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export const GlowAreaChart = memo(GlowAreaChartInner);
