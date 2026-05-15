// components/admin/Editor/PostEditor.tsx — Client Component
// 文章編輯器主體：Tiptap + SEO 面板

"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Globe } from "lucide-react";
import RichTextEditor, { type RichTextEditorHandle } from "./RichTextEditor";
import SeoPanel       from "./SeoPanel";
import FaqEditor, { type FaqItemInput } from "./FaqEditor";
import { updatePostAction } from "@/actions/post.actions";

// ── 型別 ──────────────────────────────────────────────────

export interface PostEditorData {
  id:          string;
  slug:        string;
  status:      string;
  title:       string;
  titleEn:     string;
  excerpt:     string;
  excerptEn:   string;
  content:     string;
  contentEn:   string;
  contentType: string;
  coverImage:  string;
  coverImageAlt: string;
  coverImageWidth:  number | null;
  coverImageHeight: number | null;
  coverImageBlurHash: string;
  categoryId:  string;
  scheduledAt: string | null;
  faq:         unknown[];
  seo:         {
    metaTitle:         string;
    metaDescription:   string;
    metaTitleEn:       string;
    metaDescriptionEn: string;
    focusKeyword:      string;
    ogTitle:           string;
    ogDescription:     string;
    noIndex:           boolean;
  } | null;
  tags: string[];
}

interface Props {
  post:       PostEditorData;
  categories: Array<{ id: string; name: string; slug: string }>;
  allTags:    Array<{ id: string; name: string; slug: string }>;
}

// ── Zod Schema ─────────────────────────────────────────────

// 可選正整數（表單以字串或數字傳入）
const optionalPositiveInt = z
  .union([z.literal(""), z.string(), z.number(), z.null(), z.undefined()])
  .transform((v): number | undefined => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(String(v).trim());
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return undefined;
    return n;
  });

const formSchema = z.object({
  title:       z.string().min(2, "標題至少 2 字").max(200),
  titleEn:     z.string().max(200).optional(),
  excerpt:     z.string().max(300).optional(),
  excerptEn:   z.string().max(300).optional(),
  categoryId:  z.string().optional(),
  coverImage:  z.string().url("請輸入有效的圖片 URL").optional().or(z.literal("")),
  coverImageAlt: z.string().max(300).optional(),
  coverImageWidth: optionalPositiveInt,
  coverImageHeight: optionalPositiveInt,
  coverImageBlurHash: z.string().max(200).optional(),
  scheduledAt: z.string().optional(),
});

type PostFormInput = z.input<typeof formSchema>;
type PostFormParsed = z.output<typeof formSchema>;

// ── 元件 ──────────────────────────────────────────────────

export default function PostEditor({ post, categories, allTags }: Props) {
  const router = useRouter();
  const editorZhRef = useRef<RichTextEditorHandle>(null);
  const editorEnRef = useRef<RichTextEditorHandle>(null);
  const [activeTab,   setActiveTab]   = useState<"content" | "faq" | "seo">("content");
  const [contentZh,   setContentZh]   = useState(post.content);
  const [contentEn,   setContentEn]   = useState(post.contentEn);
  const [faqItems, setFaqItems] = useState<FaqItemInput[]>(
    Array.isArray(post.faq)
      ? post.faq.filter((f): f is FaqItemInput => {
          if (typeof f !== "object" || f === null) return false;
          const item = f as Partial<FaqItemInput>;
          return typeof item.question === "string" && typeof item.answer === "string";
        })
      : []
  );
  const [saveStatus,  setSaveStatus]  = useState<"idle" | "saving" | "saved" | "published" | "error">("idle");
  const [isPending,   startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<
    PostFormInput,
    unknown,
    PostFormParsed
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title:      post.title,
      titleEn:    post.titleEn,
      excerpt:    post.excerpt,
      excerptEn:  post.excerptEn,
      categoryId: post.categoryId,
      coverImage: post.coverImage,
      coverImageAlt: post.coverImageAlt ?? "",
      coverImageWidth: post.coverImageWidth != null ? String(post.coverImageWidth) : "",
      coverImageHeight: post.coverImageHeight != null ? String(post.coverImageHeight) : "",
      coverImageBlurHash: post.coverImageBlurHash ?? "",
    },
  });

  // 標記有未儲存資料（SilentRefresh beforeunload 用）
  const markDirty = useCallback(() => {
    (window as Window & { __hasUnsavedData?: boolean }).__hasUnsavedData = true;
  }, []);

  const onSubmit = (status: "DRAFT" | "PUBLISHED" | "SCHEDULED") =>
    handleSubmit(async (values) => {
      setSaveStatus("saving");
      startTransition(async () => {
        const result = await updatePostAction({
          id:      post.id,
          ...values,
          content:   contentZh,
          contentEn: contentEn,
          contentDoc: {
            "zh-TW": editorZhRef.current?.getJSON(),
            en:      editorEnRef.current?.getJSON(),
          },
          faq: faqItems,
          status,
        });

        if (result.success) {
          (window as Window & { __hasUnsavedData?: boolean }).__hasUnsavedData = false;
          if (status === "PUBLISHED") {
            setSaveStatus("published");
            sessionStorage.setItem("admin-posts-message", "文章已發布完成");
            setTimeout(() => router.push("/admin/posts?published=1"), 700);
            return;
          }
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 3000);
        } else {
          setSaveStatus("error");
        }
      });
    })();

  const TABS = [
    { id: "content" as const, label: "內容編輯" },
    { id: "faq"     as const, label: "FAQ 編輯" },
    { id: "seo"     as const, label: "SEO 設定" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* 頂部工具列 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">
          編輯：{post.title}
        </h1>
        <div className="flex items-center gap-2">
          {/* 儲存狀態指示 */}
          {saveStatus === "saved" && (
            <span className="text-xs text-green-600" aria-live="polite">
              ✓ 已儲存
            </span>
          )}
          {saveStatus === "published" && (
            <span className="text-xs text-green-600" aria-live="polite">
              ✓ 發布完成，正在返回文章管理…
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-red-600" aria-live="assertive">
              儲存失敗，請重試
            </span>
          )}

          <button
            onClick={() => void onSubmit("DRAFT")}
            disabled={isPending}
            aria-label="儲存為草稿"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save size={14} aria-hidden="true" />
            儲存草稿
          </button>
          <button
            onClick={() => void onSubmit("PUBLISHED")}
            disabled={isPending}
            aria-label="立即發布文章"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Globe size={14} aria-hidden="true" />
            {isPending ? "處理中…" : "發布"}
          </button>
        </div>
      </div>

      {/* Tab 切換 */}
      <div
        role="tablist"
        aria-label="編輯面板"
        className="mb-4 flex border-b border-gray-200"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 面板 */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* 內容編輯 */}
        <div
          id="panel-content"
          role="tabpanel"
          aria-labelledby="tab-content"
          hidden={activeTab !== "content"}
        >
          <div className="space-y-4">
            {/* 標題 */}
            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                標題（繁中）<span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="title"
                {...register("title")}
                onChange={(e) => { register("title").onChange(e); markDirty(); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-required="true"
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" role="alert" className="mt-1 text-xs text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="excerptEn"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                摘要（英文，英文列表頁顯示）
              </label>
              <textarea
                id="excerptEn"
                rows={2}
                {...register("excerptEn")}
                onChange={(e) => { register("excerptEn").onChange(e); markDirty(); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.excerptEn && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.excerptEn.message}
                </p>
              )}
            </div>

            {/* 標題（英文）*/}
            <div>
              <label
                htmlFor="titleEn"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                標題（英文）
              </label>
              <input
                id="titleEn"
                {...register("titleEn")}
                onChange={(e) => { register("titleEn").onChange(e); markDirty(); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 摘要 */}
            <div>
              <label
                htmlFor="excerpt"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                摘要（繁中，列表頁顯示）
              </label>
              <textarea
                id="excerpt"
                rows={2}
                {...register("excerpt")}
                onChange={(e) => { register("excerpt").onChange(e); markDirty(); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="coverImage"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                封面圖 URL
              </label>
              <input
                id="coverImage"
                {...register("coverImage")}
                onChange={(e) => {
                  register("coverImage").onChange(e);
                  markDirty();
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.coverImage && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.coverImage.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="coverImageAlt"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  封面 Alt（SEO / a11y）
                </label>
                <input
                  id="coverImageAlt"
                  {...register("coverImageAlt")}
                  onChange={(e) => {
                    register("coverImageAlt").onChange(e);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="coverImageBlurHash"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  封面 BlurHash（選填）
                </label>
                <input
                  id="coverImageBlurHash"
                  {...register("coverImageBlurHash")}
                  onChange={(e) => {
                    register("coverImageBlurHash").onChange(e);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="coverImageWidth"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  封面寬（px）
                </label>
                <input
                  id="coverImageWidth"
                  type="number"
                  min={1}
                  {...register("coverImageWidth")}
                  onChange={(e) => {
                    register("coverImageWidth").onChange(e);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.coverImageWidth && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {String(errors.coverImageWidth.message)}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="coverImageHeight"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  封面高（px）
                </label>
                <input
                  id="coverImageHeight"
                  type="number"
                  min={1}
                  {...register("coverImageHeight")}
                  onChange={(e) => {
                    register("coverImageHeight").onChange(e);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.coverImageHeight && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {String(errors.coverImageHeight.message)}
                  </p>
                )}
              </div>
            </div>

            {/* 分類 */}
            <div>
              <label
                htmlFor="categoryId"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                分類
              </label>
              <select
                id="categoryId"
                {...register("categoryId")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— 不分類 —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 繁中內容編輯器 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                HTML 網頁內容編輯器（繁中）<span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <RichTextEditor
                ref={editorZhRef}
                content={contentZh}
                onChange={(v) => { setContentZh(v); markDirty(); }}
                placeholder="開始撰寫文章內容…"
              />
            </div>

            {/* 英文內容編輯器 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                HTML 網頁內容編輯器（英文，選填）
              </label>
              <RichTextEditor
                ref={editorEnRef}
                content={contentEn}
                onChange={(v) => { setContentEn(v); markDirty(); }}
                placeholder="Write English content here…"
              />
            </div>
          </div>
        </div>

        <div
          id="panel-faq"
          role="tabpanel"
          hidden={activeTab !== "faq"}
        >
          <FaqEditor
            value={faqItems}
            onChange={(next) => {
              setFaqItems(next);
              markDirty();
            }}
          />
        </div>

        {/* SEO 設定 */}
        <div
          id="panel-seo"
          role="tabpanel"
          hidden={activeTab !== "seo"}
        >
          <SeoPanel postId={post.id} initialSeo={post.seo} />
        </div>

      </div>
    </div>
  );
}
