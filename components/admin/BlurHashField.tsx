"use client";

import { useMemo } from "react";
import {
  BLURHASH_FORMAT_ERROR,
  isValidBlurHash,
  stripCjkFromBlurHashInput,
} from "@/lib/validation/blurhash";
import { cn } from "@/shared/lib/cn";

interface BlurHashFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
}

export default function BlurHashField({
  id,
  label,
  value,
  onChange,
  className,
  inputClassName,
}: BlurHashFieldProps) {
  const showError = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return !isValidBlurHash(trimmed);
  }, [value]);

  return (
    <div className={cn("block", className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          onChange(stripCjkFromBlurHashInput(e.target.value));
        }}
        placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1",
          showError
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
          inputClassName
        )}
      />
      {showError ? (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {BLURHASH_FORMAT_ERROR}
        </p>
      ) : (
        <p className="mt-1 text-xs text-gray-500">
          選填。請貼上 BlurHash 編碼（英數與符號），勿輸入中文。
        </p>
      )}
    </div>
  );
}
