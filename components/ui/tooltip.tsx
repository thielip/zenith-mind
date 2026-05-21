"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/shared/lib/cn";

export function TooltipProvider({
  delayDuration = 200,
  ...props
}: TooltipPrimitive.TooltipProviderProps) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export function Tooltip({
  ...props
}: TooltipPrimitive.TooltipProps) {
  return <TooltipPrimitive.Root {...props} />;
}

export function TooltipTrigger({
  ...props
}: TooltipPrimitive.TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger {...props} />;
}

export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-md border border-gray-200 bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-md",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
