"use client";

import { useEffect } from "react";

interface AdminToastProps {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export default function AdminToast({
  message,
  onDismiss,
  durationMs = 1500,
}: AdminToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [message, onDismiss, durationMs]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-[60] rounded-lg border border-emerald-200 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg"
    >
      {message}
    </div>
  );
}
