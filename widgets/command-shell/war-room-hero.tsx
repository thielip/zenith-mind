"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/shared/ui/badge";
import { GlassCard } from "@/shared/ui/glass-card";
import type { StatusPill } from "@/types/command-center/metrics";

interface WarRoomHeroProps {
  title: string;
  subtitle: string;
  pills: StatusPill[];
}

export function WarRoomHero({ title, subtitle, pills }: WarRoomHeroProps) {
  const reduced = useReducedMotion();

  return (
    <GlassCard glow="cyan" className="relative overflow-hidden p-6">
      {!reduced ? (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      ) : null}
      <div className="relative z-10">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400/80">
          AI 行銷作戰中心
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">{subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {pills.map((pill) => (
            <Badge
              key={pill.id}
              variant={
                pill.status === "ok"
                  ? "ok"
                  : pill.status === "running"
                    ? "running"
                    : pill.status === "error"
                      ? "error"
                      : "warn"
              }
              className="gap-2"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80 animate-pulse"
                aria-hidden
              />
              {pill.label}: {pill.value}
            </Badge>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
