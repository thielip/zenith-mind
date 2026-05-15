// components/admin/Editor/NewPostForm.tsx — Client Component
// 新增文章表單（slug 自動生成 + 手動覆蓋）

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPostAction } from "@/actions/post.create.actions";

interface Props {
  categories: Array<{ id: string; name: string; slug: string }>;
  allTags:    Array<{ id: string; name: string; slug: string }>;
}

const schema = z.object({
  title:      z.string().min(2, "標題至少 2 字").max(200),
  slug:       z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, "slug 只能包含小寫英文、數字、連字號"),
  categoryId: z.string().optional(),
  excerpt:    z.string().max(300).optional(),
  excerptEn:  z.string().max(300).optional(),
  focusKeyword: z.string().max(100, "SEO 關鍵字最多 100 字").optional(),
});

type FormValues = z.infer<typeof schema>;

function toSlug(title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return normalized || `post-${Date.now().toString(36)}`;
}

function toSeoKeyword(title: string): string {
  return title
    .replace(/[|｜:：,，。.!！?？()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export default function NewPostForm({ categories }: Props) {
  const router  = useRouter();
  const [slugEdited, setSlugEdited] = useState(false);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [isPending,  startTransition] = useTransition();

  const { register, handleSubmit, setValue, watch, getValues, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        title: "",
        slug: "",
        categoryId: "",
        excerpt: "",
        excerptEn: "",
        focusKeyword: "",
      },
    });

  const titleValue = watch("title") ?? "";

  // 標題改變時自動填入 slug（除非使用者已手動編輯）
  function onTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    register("title").onChange(e);
    if (!slugEdited) {
      setValue("slug", toSlug(e.target.value), { shouldValidate: true });
    }
    setValue("focusKeyword", toSeoKeyword(e.target.value), { shouldValidate: true });
  }

  const onSubmit = handleSubmit((values) => {
    setErrorMsg("");
    startTransition(async () => {
      try {
        const submitValues = {
          ...values,
          slug: values.slug || toSlug(values.title),
          focusKeyword: values.focusKeyword || toSeoKeyword(values.title),
        };
        const result = await createPostAction(submitValues);
        if (result.success) {
          router.push(`/admin/posts/${result.data.id}/edit`);
        } else {
          const fallback = result.error.code === "AUTH_FAILED"
            ? "登入狀態已失效，請重新登入後再新增文章"
            : result.error.code === "DUPLICATE_ERROR"
              ? "此 slug 已被使用，請更換"
              : result.error.code === "VALIDATION_ERROR"
                ? "欄位格式不正確，請檢查 slug、摘要長度與 SEO 關鍵字"
                : `建立失敗，請稍後再試（${result.error.code}）`;
          setErrorMsg(fallback);
        }
      } catch {
        setErrorMsg("建立失敗：伺服器回應異常，請重新整理後再試。");
      }
    });
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">新增文章</h1>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-8"
        noValidate
        aria-label="新增文章表單"
      >
        {/* 標題 */}
        <div>
          <label htmlFor="new-title" className="mb-1.5 block text-sm font-medium text-gray-700">
            標題（繁中）<span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="new-title"
            {...register("title")}
            onChange={onTitleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-required="true"
            aria-describedby={errors.title ? "new-title-err" : undefined}
          />
          {errors.title && (
            <p id="new-title-err" role="alert" className="mt-1 text-xs text-red-600">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="new-slug" className="mb-1.5 block text-sm font-medium text-gray-700">
            Slug（URL）<span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">/blog/</span>
            <input
              id="new-slug"
              {...register("slug")}
              onChange={(e) => {
                register("slug").onChange(e);
                setSlugEdited(true);
              }}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-required="true"
              aria-describedby="slug-hint"
            />
          </div>
          <p id="slug-hint" className="mt-1 text-xs text-gray-400">
            依標題自動產生；發布後 slug 不可更改（變更會影響 SEO）
          </p>
          {errors.slug && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.slug.message}
            </p>
          )}
        </div>

        {/* 分類 */}
        <div>
          <label htmlFor="new-category" className="mb-1.5 block text-sm font-medium text-gray-700">
            分類
          </label>
          <select
            id="new-category"
            {...register("categoryId")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">— 不分類 —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="new-focus-keyword" className="mb-1.5 block text-sm font-medium text-gray-700">
            SEO 關鍵字（自動由標題產生，可手動修改）
          </label>
          <input
            id="new-focus-keyword"
            {...register("focusKeyword")}
            onFocus={() => {
              if (!getValues("focusKeyword")) {
                setValue("focusKeyword", toSeoKeyword(getValues("title") ?? ""), { shouldValidate: true });
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.focusKeyword && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.focusKeyword.message}
            </p>
          )}
        </div>

        {/* 摘要 */}
        <div>
          <label htmlFor="new-excerpt" className="mb-1.5 block text-sm font-medium text-gray-700">
            摘要（選填，列表頁顯示）
          </label>
          <textarea
            id="new-excerpt"
            rows={2}
            {...register("excerpt")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="new-excerpt-en" className="mb-1.5 block text-sm font-medium text-gray-700">
            英文摘要（選填，英文列表頁顯示）
          </label>
          <textarea
            id="new-excerpt-en"
            rows={2}
            {...register("excerptEn")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.excerptEn && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.excerptEn.message}
            </p>
          )}
        </div>

        {/* 全域錯誤 */}
        {errorMsg && (
          <p role="alert" className="text-sm text-red-600">{errorMsg}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isPending || titleValue.length < 2}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isPending ? "建立中…" : "建立草稿並開始編輯"}
          </button>
        </div>
      </form>
    </div>
  );
}
