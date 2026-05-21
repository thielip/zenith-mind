// components/admin/Editor/SeoPanel.tsx — Client Component
// SEO 欄位面板（Meta / OG；可從內容分頁帶入）

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateSeoAction } from "@/actions/post.actions";

export interface SeoData {
  metaTitle:         string;
  metaDescription:   string;
  metaTitleEn:       string;
  metaDescriptionEn: string;
  focusKeyword:      string;
  focusKeywordEn:    string;
  ogTitle:           string;
  ogDescription:     string;
  noIndex:           boolean;
}

/** 內容分頁欄位，供「從內容帶入」同步 SEO */
export interface SeoContentSync {
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  focusKeyword: string;
  focusKeywordEn: string;
}

interface Props {
  postId:     string;
  initialSeo: SeoData | null;
  syncFrom?:  SeoContentSync;
  readOnly?:  boolean;
}

const optionalSeoText = (max: number, label: string) =>
  z.string()
    .trim()
    .max(max, `${label} 過長，最多 ${max} 字。請縮短文字，避免搜尋結果被截斷。`)
    .optional();

const seoSchema = z.object({
  metaTitle:         optionalSeoText(70, "Meta Title"),
  metaDescription:   optionalSeoText(160, "Meta Description"),
  metaTitleEn:       optionalSeoText(70, "English Meta Title"),
  metaDescriptionEn: optionalSeoText(160, "English Meta Description"),
  focusKeyword:      optionalSeoText(100, "中文 SEO 關鍵字"),
  focusKeywordEn:    optionalSeoText(100, "英文 SEO 關鍵字"),
  ogTitle:           optionalSeoText(70, "OG Title"),
  ogDescription:     optionalSeoText(200, "OG Description"),
  noIndex:           z.boolean().default(false),
});

type FormInput = z.input<typeof seoSchema>;
type FormValues = z.output<typeof seoSchema>;

function sliceField(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export default function SeoPanel({
  postId,
  initialSeo,
  syncFrom,
  readOnly = false,
}: Props) {
  const [saveMsg, setSaveMsg]   = useState("");
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormInput, unknown, FormValues>({
      resolver: zodResolver(seoSchema),
      defaultValues: initialSeo ?? {
        metaTitle: "", metaDescription: "", metaTitleEn: "",
        metaDescriptionEn: "", focusKeyword: "", focusKeywordEn: "",
        ogTitle: "", ogDescription: "", noIndex: false,
      },
    });

  const metaTitleLen = watch("metaTitle")?.length ?? 0;
  const metaDescLen  = watch("metaDescription")?.length ?? 0;
  const metaTitleEnLen = watch("metaTitleEn")?.length ?? 0;
  const metaDescEnLen = watch("metaDescriptionEn")?.length ?? 0;

  const metaTitle = watch("metaTitle") ?? "";
  const metaDescription = watch("metaDescription") ?? "";
  const ogTitle = watch("ogTitle") ?? "";
  const ogDescription = watch("ogDescription") ?? "";

  const effectiveOgTitle =
    ogTitle.trim() || metaTitle.trim() || "（尚未設定）";
  const effectiveOgDescription =
    ogDescription.trim() || metaDescription.trim() || "（尚未設定）";

  function applySyncFromContent() {
    if (!syncFrom || readOnly) return;
    setValue("metaTitle", sliceField(syncFrom.title, 70));
    setValue("metaDescription", sliceField(syncFrom.excerpt, 160));
    setValue("focusKeyword", sliceField(syncFrom.focusKeyword, 100));
    setValue("metaTitleEn", sliceField(syncFrom.titleEn, 70));
    setValue("metaDescriptionEn", sliceField(syncFrom.excerptEn, 160));
    setValue("focusKeywordEn", sliceField(syncFrom.focusKeywordEn, 100));
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateSeoAction({ postId, ...values });
      if (result.success) {
        setSaveMsg("✓ SEO 設定已儲存");
      } else if (result.error.code === "FORBIDDEN") {
        setSaveMsg("✗ 參訪帳號僅能檢視，無法修改");
      } else if (result.error.code === "VALIDATION_ERROR") {
        setSaveMsg("✗ 欄位格式錯誤：請檢查字數上限與特殊字元，修正紅字提示後再儲存。");
      } else {
        setSaveMsg("✗ 儲存失敗，請重試");
      }
      setTimeout(() => setSaveMsg(""), 3000);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate aria-label="SEO 設定表單">
      {saveMsg && (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm font-medium ${saveMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}
        >
          {saveMsg}
        </p>
      )}

      {syncFrom && !readOnly && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3">
          <p className="text-sm text-blue-900">
            可將「內容編輯」分頁的標題、摘要與 SEO 關鍵字帶入下方欄位（不覆寫已填的 OG 欄位）。
          </p>
          <button
            type="button"
            onClick={applySyncFromContent}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            從內容欄位帶入
          </button>
        </div>
      )}

      <fieldset className="rounded-xl border border-gray-200 p-5">
        <legend className="px-1 text-sm font-semibold text-gray-700">繁中 SEO</legend>
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="metaTitle" className="mb-1 block text-sm font-medium text-gray-700">
              Meta Title
              <span className="ml-1 text-xs font-normal text-gray-400">← 標題（繁中）</span>
              <span className="ml-1 text-xs text-gray-400">（{metaTitleLen}/70）</span>
            </label>
            <input
              id="metaTitle"
              {...register("metaTitle")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-describedby={errors.metaTitle ? "metaTitle-err" : undefined}
            />
            {errors.metaTitle && (
              <p id="metaTitle-err" role="alert" className="mt-1 text-xs text-red-600">
                {errors.metaTitle.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="metaDescription" className="mb-1 block text-sm font-medium text-gray-700">
              Meta Description
              <span className="ml-1 text-xs font-normal text-gray-400">← 中文摘要</span>
              <span className="ml-1 text-xs text-gray-400">（{metaDescLen}/160）</span>
            </label>
            <textarea
              id="metaDescription"
              rows={3}
              {...register("metaDescription")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.metaDescription && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.metaDescription.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="focusKeyword" className="mb-1 block text-sm font-medium text-gray-700">
              中文 SEO 關鍵字
              <span className="ml-1 text-xs font-normal text-gray-400">← 內容分頁同名欄位</span>
            </label>
            <input
              id="focusKeyword"
              {...register("focusKeyword")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-gray-200 p-5">
        <legend className="px-1 text-sm font-semibold text-gray-700">English SEO</legend>
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="metaTitleEn" className="mb-1 block text-sm font-medium text-gray-700">
              Meta Title (EN)
              <span className="ml-1 text-xs font-normal text-gray-400">← 標題（英文）</span>
              <span className="ml-1 text-xs text-gray-400">（{metaTitleEnLen}/70）</span>
            </label>
            <input
              id="metaTitleEn"
              {...register("metaTitleEn")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-describedby={errors.metaTitleEn ? "metaTitleEn-err" : undefined}
            />
            {errors.metaTitleEn && (
              <p id="metaTitleEn-err" role="alert" className="mt-1 text-xs text-red-600">
                {errors.metaTitleEn.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="metaDescriptionEn" className="mb-1 block text-sm font-medium text-gray-700">
              Meta Description (EN)
              <span className="ml-1 text-xs font-normal text-gray-400">← 英文摘要</span>
              <span className="ml-1 text-xs text-gray-400">（{metaDescEnLen}/160）</span>
            </label>
            <textarea
              id="metaDescriptionEn"
              rows={3}
              {...register("metaDescriptionEn")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-describedby={errors.metaDescriptionEn ? "metaDescriptionEn-err" : undefined}
            />
            {errors.metaDescriptionEn && (
              <p id="metaDescriptionEn-err" role="alert" className="mt-1 text-xs text-red-600">
                {errors.metaDescriptionEn.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="focusKeywordEn" className="mb-1 block text-sm font-medium text-gray-700">
              英文 SEO 關鍵字
              <span className="ml-1 text-xs font-normal text-gray-400">← 內容分頁同名欄位</span>
            </label>
            <input
              id="focusKeywordEn"
              {...register("focusKeywordEn")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-gray-200 p-5">
        <legend className="px-1 text-sm font-semibold text-gray-700">Open Graph</legend>
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor="ogTitle" className="mb-1 block text-sm font-medium text-gray-700">
              OG Title（留空則使用 Meta Title）
            </label>
            <input
              id="ogTitle"
              {...register("ogTitle")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="ogDescription" className="mb-1 block text-sm font-medium text-gray-700">
              OG Description（留空則使用 Meta Description）
            </label>
            <textarea
              id="ogDescription"
              rows={2}
              {...register("ogDescription")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div
            className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
            aria-live="polite"
          >
            <p className="font-medium text-gray-700">前台實際使用（與公開站邏輯一致）</p>
            <p className="mt-1">
              <span className="text-gray-500">OG Title：</span>
              {effectiveOgTitle}
            </p>
            <p className="mt-0.5">
              <span className="text-gray-500">OG Description：</span>
              {effectiveOgDescription}
            </p>
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-5">
        <input
          type="checkbox"
          id="noIndex"
          {...register("noIndex")}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="noIndex" className="text-sm text-gray-700">
          noIndex（此頁面不被搜尋引擎收錄）
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || readOnly}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isPending ? "儲存中…" : "儲存 SEO 設定"}
        </button>
      </div>
    </form>
  );
}
