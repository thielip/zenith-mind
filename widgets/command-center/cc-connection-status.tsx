"use client";

import { memo } from "react";
import Link from "next/link";
import { Badge } from "@/shared/ui/badge";

export type ConnectionRow = {
  id: string;
  name: string;
  status: "ok" | "missing" | "error";
  detail?: string;
};

const statusVariant = {
  ok: "ok",
  missing: "warn",
  error: "error",
} as const;

const statusLabel = {
  ok: "已連線",
  missing: "未設定",
  error: "異常",
} as const;

function CcConnectionStatusInner({ items }: { items: ConnectionRow[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">尚無串接探測資料</p>
    );
  }

  return (
    <ul className="space-y-2" aria-label="後台串接狀態">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">{item.name}</p>
            {item.detail ? (
              <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
            ) : null}
          </div>
          <Badge variant={statusVariant[item.status]}>{statusLabel[item.status]}</Badge>
        </li>
      ))}
      <li className="pt-1 text-center">
        <Link
          href="/admin/dashboard/integrations"
          className="text-xs text-cyan-400/90 hover:text-cyan-300 hover:underline"
        >
          管理所有串接設定 →
        </Link>
      </li>
    </ul>
  );
}

export const CcConnectionStatus = memo(CcConnectionStatusInner);
