// components/admin/Dashboard/TrafficChart.tsx — Client Component
// Recharts 流量趨勢折線圖（GA4 數據）

"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { TrafficDataPoint } from "@/infrastructure/ga4/reporting.client";

interface Props {
  data: TrafficDataPoint[];
}

export default function TrafficChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        尚無流量數據（GA4 API 未連線或無數據）
      </div>
    );
  }

  // 日期格式化（YYYYMMDD → MM/DD）
  const formatted = data.map((d) => ({
    ...d,
    date: `${d.date.slice(4, 6)}/${d.date.slice(6, 8)}`,
  }));

  return (
    // role="img" 讓螢幕閱讀器知道這是圖表
    <div role="img" aria-label="近 30 天流量趨勢折線圖">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={formatted}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
          />
          <Line
            type="monotone"
            dataKey="pageViews"
            name="頁面瀏覽"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            name="工作階段"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="users"
            name="使用者"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
