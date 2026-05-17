import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";
import { Skeleton } from "@/shared/ui/skeleton";

interface AsyncStateProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}

export function AsyncState({
  isLoading,
  isError,
  isEmpty,
  errorMessage = "載入失敗",
  emptyMessage = "尚無資料",
  onRetry,
  skeleton,
  children,
}: AsyncStateProps) {
  if (isLoading) {
    return (
      skeleton ?? (
        <GlassCard className="p-6 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </GlassCard>
      )
    );
  }

  if (isError) {
    return (
      <GlassCard glow="red" className="p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-red-300">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <p className="text-sm">{errorMessage}</p>
        </div>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="w-fit">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            重試
          </Button>
        ) : null}
      </GlassCard>
    );
  }

  if (isEmpty) {
    return (
      <GlassCard className="p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </GlassCard>
    );
  }

  return <>{children}</>;
}
