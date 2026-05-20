"use client";

import { useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import {
  EXTERNAL_IMAGE_URL_HINT,
  isValidExternalImageUrl,
} from "@/lib/validation/external-image-url";
import { cn } from "@/shared/lib/cn";

interface ExternalImageUrlFieldProps {
  id?: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  previewAlt?: string;
  className?: string;
  inputClassName?: string;
}

export default function ExternalImageUrlField({
  id,
  label,
  value,
  onChange,
  placeholder = "https://example.com/image.jpg",
  previewAlt = "圖片預覽",
  className,
  inputClassName,
}: ExternalImageUrlFieldProps) {
  const [previewBroken, setPreviewBroken] = useState(false);
  const trimmed = value.trim();

  const validation = useMemo(() => {
    if (!trimmed) return { valid: null as boolean | null, showError: false };
    const valid = isValidExternalImageUrl(trimmed);
    return { valid, showError: !valid };
  }, [trimmed]);

  const showPreview = validation.valid === true && !previewBroken;

  return (
    <div className={cn("block", className)}>
      <label
        htmlFor={id}
        className="text-xs font-semibold text-gray-700"
      >
        {label}
      </label>
      <input
        id={id}
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => {
          setPreviewBroken(false);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={cn(
          "mt-1 w-full rounded-lg border px-3 py-2 text-sm",
          validation.showError
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
          inputClassName
        )}
      />
      <p className="mt-1 text-[11px] text-gray-500">{EXTERNAL_IMAGE_URL_HINT}</p>
      {validation.showError ? (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {EXTERNAL_IMAGE_URL_HINT}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-3 flex min-h-[7rem] items-center justify-center overflow-hidden rounded-xl border border-dashed bg-white",
          showPreview ? "border-gray-200" : "border-gray-300"
        )}
      >
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element -- 任意網域即時預覽
          <img
            src={trimmed}
            alt={previewAlt}
            className="max-h-40 w-full object-contain"
            onLoad={() => setPreviewBroken(false)}
            onError={() => setPreviewBroken(true)}
          />
        ) : previewBroken && validation.valid ? (
          <p className="px-3 text-center text-xs text-amber-700">
            網址格式正確，但無法載入預覽（可能為防盜連或網址失效）
          </p>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <ImageIcon size={28} aria-hidden />
            <span className="text-xs">
              {trimmed ? "格式正確後將顯示預覽" : "貼上圖片網址後即時預覽"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
