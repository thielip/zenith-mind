"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { uploadSiteAssetAction } from "@/actions/site.actions";
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
  /** 預覽區比例；16:9 用於主題卡片等橫圖 */
  previewAspect?: "16:9" | "contain";
  /** 啟用後可上傳至 Supabase，自動填入公開網址 */
  uploadFolder?: string;
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
  previewAspect = "contain",
  uploadFolder,
  className,
  inputClassName,
}: ExternalImageUrlFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, startUpload] = useTransition();
  const trimmed = value.trim();
  const canUpload = Boolean(uploadFolder);

  const validation = useMemo(() => {
    if (!trimmed) return { valid: null as boolean | null, showError: false };
    const valid = isValidExternalImageUrl(trimmed);
    return { valid, showError: !valid };
  }, [trimmed]);

  const showPreview = validation.valid === true && !previewBroken;

  function handleUpload(file: File) {
    if (!uploadFolder) return;
    setUploadError("");
    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", uploadFolder);
    formData.set("clientFileName", file.name);

    startUpload(async () => {
      const result = await uploadSiteAssetAction(formData);
      if (!result.success || !result.data?.url) {
        setUploadError(result.error?.message ?? "上傳失敗，請稍後再試。");
        return;
      }
      setPreviewBroken(false);
      onChange(result.data.url);
    });
  }

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
      {canUpload ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <Upload size={14} aria-hidden />
            )}
            {isUploading ? "上傳中…" : "上傳圖片"}
          </button>
          <Link
            href="/admin/media"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            媒體庫
          </Link>
        </div>
      ) : null}
      <p className="mt-1 text-[11px] text-gray-500">
        {canUpload
          ? "可上傳或貼上外部網址；上傳後會自動填入網址。"
          : EXTERNAL_IMAGE_URL_HINT}
      </p>
      {uploadError ? (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {uploadError}
        </p>
      ) : null}
      {validation.showError ? (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {EXTERNAL_IMAGE_URL_HINT}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-3 flex w-full items-center justify-center overflow-hidden rounded-xl border border-dashed bg-white",
          previewAspect === "16:9" ? "aspect-video" : "min-h-[7rem]",
          showPreview ? "border-gray-200" : "border-gray-300"
        )}
      >
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element -- 任意網域即時預覽
          <img
            src={trimmed}
            alt={previewAlt}
            className={cn(
              "h-full w-full",
              previewAspect === "16:9" ? "object-cover" : "max-h-40 object-contain"
            )}
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
