import { cn } from "@/shared/lib/cn";

interface DemoBannerProps {
  title: string;
  description: string;
  className?: string;
}

export function DemoBanner({ title, description, className }: DemoBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100",
        className
      )}
    >
      <p className="font-semibold text-amber-200">{title}</p>
      <p className="mt-1 text-amber-100/90">{description}</p>
    </div>
  );
}
