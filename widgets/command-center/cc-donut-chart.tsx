"use client";

import { memo, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

const tooltipStyle = {
  background: "#0B0F19",
  border: "1px solid rgba(0,210,255,0.25)",
  borderRadius: 8,
  fontSize: 12,
};

function CcDonutChartInner({
  segments,
  centerLabel,
  centerValue,
  size = 200,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}) {
  const data = useMemo(
    () => segments.filter((s) => s.value > 0),
    [segments]
  );
  const total = data.reduce((a, s) => a + s.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-500"
        style={{ height: size }}
      >
        尚無數據
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="rgba(15,23,42,0.8)"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue ? (
            <span className="text-2xl font-bold tabular-nums text-white">{centerValue}</span>
          ) : null}
          {centerLabel ? (
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              {centerLabel}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export const CcDonutChart = memo(CcDonutChartInner);
