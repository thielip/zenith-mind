"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AffiliateClickSparklineProps {
  series: number[];
  todayClicks: number;
  totalClicks: number;
}

export default function AffiliateClickSparkline({
  series,
  todayClicks,
  totalClicks,
}: AffiliateClickSparklineProps) {
  const max = Math.max(1, ...series);
  const width = 64;
  const height = 22;
  const points = series
    .map((v, i) => {
      const x = series.length <= 1 ? width / 2 : (i / (series.length - 1)) * width;
      const y = height - (v / max) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  const weekTotal = series.reduce((a, b) => a + b, 0);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex cursor-default items-center gap-2">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="shrink-0 text-blue-500"
            aria-hidden
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points}
            />
          </svg>
          <span className="tabular-nums text-gray-800">
            <span className="font-semibold text-blue-700">{todayClicks}</span>
            <span className="text-gray-400"> / </span>
            {totalClicks.toLocaleString()}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-medium">今日 {todayClicks} 次 · 累計 {totalClicks.toLocaleString()} 次</p>
        <p className="mt-0.5 text-gray-300">近 7 日共 {weekTotal} 次點擊</p>
      </TooltipContent>
    </Tooltip>
  );
}
