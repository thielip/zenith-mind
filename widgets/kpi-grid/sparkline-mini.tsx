"use client";

import { ResponsiveContainer, LineChart, Line } from "recharts";

export function SparklineMini({
  values,
  animate,
}: {
  values: number[];
  animate: boolean;
}) {
  const chartData = values.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height="100%">
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
  );
}
