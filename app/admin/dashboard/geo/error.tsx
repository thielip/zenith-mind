"use client";

import { useEffect } from "react";

export default function GeoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GEO dashboard]", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100">
      <h2 className="text-lg font-semibold">GEO 儀表板載入失敗</h2>
      <p className="mt-2 text-sm text-red-200/90">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg border border-red-400/50 px-4 py-2 text-sm font-medium hover:bg-red-500/20"
      >
        重試
      </button>
    </div>
  );
}
