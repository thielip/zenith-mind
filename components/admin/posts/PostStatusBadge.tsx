import { cn } from "@/shared/lib/cn";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "border-emerald-600 bg-emerald-600 text-white",
  DRAFT: "border-gray-300 bg-gray-200 text-gray-800",
  SCHEDULED: "border-blue-600 bg-blue-600 text-white",
  ARCHIVED: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已發布",
  SCHEDULED: "排程中",
  ARCHIVED: "已封存",
};

export default function PostStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status] ?? "border-gray-200 bg-gray-100 text-gray-600"
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
