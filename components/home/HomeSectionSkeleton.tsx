/** 動態載入區塊的佔位，避免 layout shift */
export function HomeSectionSkeleton({ minHeight = "min-h-48" }: { minHeight?: string }) {
  return (
    <div
      className={`${minHeight} w-full animate-pulse rounded-2xl bg-slate-100/90`}
      aria-hidden="true"
    />
  );
}
