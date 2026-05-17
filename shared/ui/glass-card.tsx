import { cn } from "@/shared/lib/cn";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "cyan" | "green" | "amber" | "red" | "none";
  as?: "div" | "section" | "article";
}

const glowMap = {
  cyan: "shadow-[0_0_40px_-12px_rgba(0,210,255,0.35)] border-cyan-500/20",
  green: "shadow-[0_0_40px_-12px_rgba(16,185,129,0.3)] border-emerald-500/20",
  amber: "shadow-[0_0_40px_-12px_rgba(245,158,11,0.3)] border-amber-500/20",
  red: "shadow-[0_0_40px_-12px_rgba(239,68,68,0.35)] border-red-500/30",
  none: "border-slate-800/60",
};

export function GlassCard({
  children,
  className,
  glow = "none",
  as: Tag = "div",
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        "rounded-xl border bg-slate-950/40 backdrop-blur-md",
        glowMap[glow],
        className
      )}
    >
      {children}
    </Tag>
  );
}
