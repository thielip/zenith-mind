// components/admin/Dashboard/StatCard.tsx — Server Component

import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number;
  icon:  LucideIcon;
  color: "blue" | "yellow" | "green" | "purple";
}

const COLOR_MAP = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   text: "text-blue-700"   },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", text: "text-yellow-700" },
  green:  { bg: "bg-green-50",  icon: "text-green-600",  text: "text-green-700"  },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", text: "text-purple-700" },
} as const;

export default function StatCard({ label, value, icon: Icon, color }: Props) {
  const c = COLOR_MAP[color];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`rounded-lg p-2 ${c.bg}`}>
          <Icon size={16} className={c.icon} aria-hidden="true" />
        </div>
      </div>
      <p className={`mt-2 text-2xl font-bold ${c.text}`} aria-label={`${label}：${value}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
