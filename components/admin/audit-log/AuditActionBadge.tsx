import { cn } from "@/shared/lib/cn";

const ACTION_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  CREATE: {
    label: "建立",
    className: "border-emerald-600 bg-emerald-600 text-white",
  },
  UPDATE: {
    label: "更新",
    className: "border-blue-600 bg-blue-600 text-white",
  },
  DELETE: {
    label: "刪除",
    className: "border-red-600 bg-red-600 text-white",
  },
  LOGIN: {
    label: "登入",
    className: "border-gray-300 bg-gray-200 text-gray-800",
  },
  LOGOUT: {
    label: "登出",
    className: "border-violet-300 bg-violet-50 text-violet-800",
  },
  TOTP_SETUP: { label: "設定 2FA", className: "border-amber-300 bg-amber-50 text-amber-800" },
  TOTP_VERIFY: { label: "驗證 2FA", className: "border-amber-300 bg-amber-50 text-amber-800" },
  AI_GENERATE: { label: "AI 生成", className: "border-indigo-300 bg-indigo-50 text-indigo-800" },
  PUBLISH: { label: "發布", className: "border-teal-600 bg-teal-600 text-white" },
  SCHEDULE: { label: "排程", className: "border-orange-300 bg-orange-50 text-orange-800" },
};

export default function AuditActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? {
    label: action,
    className: "border-gray-200 bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}
