"use client";

import { ResponsiveContainer, LineChart, Line } from "recharts";

const MIN_CHART_PX = 24;

export function SparklineMini({
  values,
  animate,
}: {
  values: number[];
  animate: boolean;
}) {
  const safeValues =
    values.length > 0 ? values : [0, 0, 0, 0, 0, 0, 0];
  const chartData = safeValues.map((v, i) => ({ i, v }));

  return (
    <div className="h-full w-full" style={{ minHeight: MIN_CHART_PX }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={MIN_CHART_PX}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="#00D2FF"
            strokeWidth={2}
            dot={false}
            isAnimationActive={animate}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
