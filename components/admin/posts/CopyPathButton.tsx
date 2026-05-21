"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyPathButtonProps {
  path: string;
  label?: string;
}

export default function CopyPathButton({ path, label = "複製文章路徑" }: CopyPathButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      const full =
        typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
      await navigator.clipboard.writeText(full);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      aria-label={label}
      title={label}
    >
      {copied ? (
        <Check size={14} className="text-emerald-600" aria-hidden />
      ) : (
        <Copy size={14} aria-hidden />
      )}
    </button>
  );
}
