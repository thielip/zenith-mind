"use client";

import { memo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface RadarPoint {
  subject: string;
  value: number;
  fullMark?: number;
}

const tooltipStyle = {
  background: "#0B0F19",
  border: "1px solid rgba(0,210,255,0.25)",
  borderRadius: 8,
  fontSize: 12,
};

function CcRadarChartInner({ data, height = 260 }: { data: RadarPoint[]; height?: number }) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500" style={{ height }}>
        尚無數據
      </p>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="rgba(148,163,184,0.15)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#64748b", fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="SoV"
            dataKey="value"
            stroke="#00D2FF"
            fill="#00D2FF"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Tooltip contentStyle={tooltipStyle} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const CcRadarChart = memo(CcRadarChartInner);
