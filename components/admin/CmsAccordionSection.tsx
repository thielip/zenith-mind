"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface CmsAccordionSectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  variant?: "default" | "hero" | "nested";
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function CmsAccordionSection({
  id,
  eyebrow,
  title,
  description,
  defaultOpen = true,
  variant = "default",
  headerExtra,
  children,
  className,
}: CmsAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const shell =
    variant === "hero"
      ? "rounded-3xl border border-blue-200 bg-white shadow-sm ring-1 ring-blue-100"
      : variant === "nested"
        ? "rounded-2xl border border-gray-200 bg-gray-50/80"
        : "rounded-3xl border border-gray-200 bg-white shadow-sm";

  const padding = variant === "nested" ? "p-4" : "p-6";

  return (
    <section id={id} className={cn("scroll-mt-[11rem]", padding, shell, className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          aria-expanded={open}
        >
          <ChevronDown
            size={20}
            className={cn(
              "mt-0.5 shrink-0 text-gray-500 transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          />
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="mt-1 text-xl font-bold text-gray-950">{title}</h2>
            {description ? (
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            ) : null}
          </div>
        </button>
        {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
      </div>
      {open ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
