"use client";

import { memo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface CcIntegrationDonutProps {
  ok: number;
  missing: number;
  error: number;
}

function CcIntegrationDonutInner({ ok, missing, error }: CcIntegrationDonutProps) {
  const total = ok + missing + error;
  const pct = total > 0 ? Math.round((ok / total) * 100) : 0;
  const segments = [
    { name: "正常", value: ok, color: "#B2FF59" },
    { name: "缺漏", value: missing, color: "#FBBF24" },
    { name: "異常", value: error, color: "#F87171" },
  ].filter((s) => s.value > 0);

  if (total === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">尚無串接資料</p>
    );
  }

  return (
    <div className="relative mx-auto h-52 w-full max-w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={3}
            stroke="#0B0F19"
            strokeWidth={2}
          >
            {segments.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-bold tabular-nums"
          style={{ color: "#B2FF59" }}
        >
          {pct}%
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          串接健康
        </span>
      </div>
      <ul className="mt-4 space-y-1.5 font-mono text-xs">
        <li className="flex justify-between text-emerald-400">
          <span>正常</span>
          <span>{ok}</span>
        </li>
        <li className="flex justify-between text-amber-300">
          <span>缺漏</span>
          <span>{missing}</span>
        </li>
        <li className="flex justify-between text-red-400">
          <span>異常</span>
          <span>{error}</span>
        </li>
      </ul>
    </div>
  );
}

export const CcIntegrationDonut = memo(CcIntegrationDonutInner);
