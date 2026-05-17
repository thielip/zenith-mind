import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-mono",
  {
    variants: {
      variant: {
        default: "border-slate-700 bg-slate-900/80 text-slate-200",
        ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        warn: "border-amber-500/40 bg-amber-500/10 text-amber-200",
        error: "border-red-500/40 bg-red-500/10 text-red-200",
        cyan: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
        running: "border-blue-500/40 bg-blue-500/10 text-blue-200 animate-pulse",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
