"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

interface CcWarningAlertProps {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export function CcWarningAlert({
  title,
  message,
  actionHref = "/admin/dashboard/integrations",
  actionLabel = "前往串接設定修復憑證",
  className,
}: CcWarningAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 backdrop-blur-md sm:flex-row sm:items-start",
        "shadow-[0_0_32px_-8px_rgba(245,158,11,0.35)]",
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20">
        <AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-100">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-100/85">{message}</p>
        {actionHref ? (
          <Button variant="outline" size="sm" className="mt-3 border-amber-500/40 text-amber-100 hover:bg-amber-500/20" asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
