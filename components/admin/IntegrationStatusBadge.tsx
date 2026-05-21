import { cn } from "@/shared/lib/cn";

export function IntegrationStatusBadge({
  status,
}: {
  status: "ok" | "missing" | "error";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "ok" && "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-500/40",
        status === "missing" &&
          "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/40",
        status === "error" && "bg-red-500/20 text-red-100 ring-1 ring-red-500/40"
      )}
    >
      {status === "ok" ? "OK" : status === "missing" ? "Missing" : "Error"}
    </span>
  );
}
