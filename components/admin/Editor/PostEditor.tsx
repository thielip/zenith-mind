// components/admin/Editor/PostEditor.tsx — Client Component
// 文章編輯器主體：Tiptap + SEO 分頁

"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Globe, Calendar, Lock } from "lucide-react";
import RichTextEditor, { type RichTextEditorHandle } from "./RichTextEditor";
import SeoPanel       from "./SeoPanel";
import FaqEditor, { type FaqItemInput } from "./FaqEditor";
import { updatePostAction } from "@/actions/post.actions";
import BlurHashField from "@/components/admin/BlurHashField";
import ExternalImageUrlField from "@/components/admin/ExternalImageUrlField";
import { isValidBlurHash, BLURHASH_FORMAT_ERROR } from "@/lib/validation/blurhash";
import { optionalExternalImageUrlSchema } from "@/lib/validation/external-image-url";

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
  isPasswordProtected: boolean;
  hasAccessPassword: boolean;
  faq:         unknown[];
  seo:         {
    metaTitle:         string;
    metaDescription:   string;
    metaTitleEn:       string;
    metaDescriptionEn: string;
    focusKeyword:      string;
    focusKeywordEn:    string;
    ogTitle:           string;
    ogDescription:     string;
    noIndex:           boolean;
  } | null;
  tags: string[];
}

interface Props {
  post:       PostEditorData;
  categories: Array<{ id: string; name: string; slug: string }>;
  allTags?:   Array<{ id: string; name: string; slug: string }>;
  readOnly?:  boolean;
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const optionalPositiveInt = z
  .union([z.literal(""), z.string(), z.number(), z.null(), z.undefined()])
  .transform((v): number | undefined => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(String(v).trim());
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return undefined;
    return n;
  });

const formSchema = z.object({
  title:       z.string().min(2, "Title at least 2 characters").max(200),
  titleEn:     z.string().min(2, "英文標題至少 2 字").max(200),
  excerpt:     z.string().max(300).optional(),
  excerptEn:   z.string().max(300).optional(),
  focusKeyword: z.string().max(100).optional(),
  focusKeywordEn: z.string().max(100).optional(),
  categoryId:  z.string().optional(),
  coverImage: optionalExternalImageUrlSchema,
  coverImageAlt: z.string().max(300).optional(),
  coverImageWidth: optionalPositiveInt,
  coverImageHeight: optionalPositiveInt,
  coverImageBlurHash: z
    .string()
    .max(200)
    .optional()
    .refine((v) => isValidBlurHash(v ?? ""), { message: BLURHASH_FORMAT_ERROR }),
  scheduledAt: z.string().optional(),
  isPasswordProtected: z.boolean().optional(),
  accessPassword: z.string().max(128).optional(),
  clearAccessPassword: z.boolean().optional(),
});

type PostFormInput = z.input<typeof formSchema>;
type PostFormParsed = z.output<typeof formSchema>;

export default function PostEditor({ post, categories, readOnly = false }: Props) {
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<
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
      focusKeyword: post.seo?.focusKeyword ?? "",
      focusKeywordEn: post.seo?.focusKeywordEn ?? "",
      categoryId: post.categoryId,
      coverImage: post.coverImage,
      coverImageAlt: post.coverImageAlt ?? "",
      coverImageWidth: post.coverImageWidth != null ? String(post.coverImageWidth) : "",
      coverImageHeight: post.coverImageHeight != null ? String(post.coverImageHeight) : "",
      coverImageBlurHash: post.coverImageBlurHash ?? "",
      scheduledAt: toDatetimeLocalValue(post.scheduledAt),
      isPasswordProtected: post.isPasswordProtected,
    },
  });

  const [accessPassword, setAccessPassword] = useState("");
  const [clearAccessPassword, setClearAccessPassword] = useState(false);

  const watchedTitle = watch("title") ?? "";
  const watchedTitleEn = watch("titleEn") ?? "";
  const watchedExcerpt = watch("excerpt") ?? "";
  const watchedExcerptEn = watch("excerptEn") ?? "";
  const watchedFocusKeyword = watch("focusKeyword") ?? "";
  const watchedFocusKeywordEn = watch("focusKeywordEn") ?? "";

  const seoSyncFrom = {
    title: watchedTitle,
    titleEn: watchedTitleEn,
    excerpt: watchedExcerpt,
    excerptEn: watchedExcerptEn,
    focusKeyword: watchedFocusKeyword,
    focusKeywordEn: watchedFocusKeywordEn,
  };

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
          focusKeyword: values.focusKeyword,
          focusKeywordEn: values.focusKeywordEn,
          scheduledAt: values.scheduledAt
            ? new Date(values.scheduledAt).toISOString()
            : undefined,
          accessPassword: accessPassword || undefined,
          clearAccessPassword,
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
            sessionStorage.setItem("admin-posts-message", "published");
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">
          編輯：{post.title}
        </h1>
        <div className="flex items-center gap-2">
          {saveStatus === "saved" && (
            <span className="text-xs text-green-600" aria-live="polite">
              ✓ 已儲存
            </span>
          )}
          {saveStatus === "published" && (
            <span className="text-xs text-green-600" aria-live="polite">
              ✓ 已發布完成，正在前往列表…
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-red-600" aria-live="assertive">
              儲存失敗，請重試
            </span>
          )}

          <button
            onClick={() => void onSubmit("DRAFT")}
            disabled={isPending || readOnly}
            aria-label="Save as draft"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save size={14} aria-hidden="true" />
            儲存草稿
          </button>
          <button
            onClick={() => void onSubmit("SCHEDULED")}
            disabled={isPending || readOnly}
            aria-label="Schedule publish"
            className="flex items-center gap-1.5 rounded-lg border border-yellow-500 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            <Calendar size={14} aria-hidden="true" />
            排程發布
          </button>
          <button
            onClick={() => void onSubmit("PUBLISHED")}
            disabled={isPending || readOnly}
            aria-label="Publish now"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Globe size={14} aria-hidden="true" />
            {isPending ? "處理中…" : "發布"}
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="編輯分頁"
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

      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* 內容編輯 */}
        <div
          id="panel-content"
          role="tabpanel"
          aria-labelledby="tab-content"
          hidden={activeTab !== "content"}
        >
          <div className="space-y-4">
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
                htmlFor="titleEn"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                標題（英文）<span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="titleEn"
                {...register("titleEn")}
                onChange={(e) => { register("titleEn").onChange(e); markDirty(); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-required="true"
              />
              {errors.titleEn && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.titleEn.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="excerpt"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                中文摘要
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
                htmlFor="excerptEn"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                英文摘要
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="focusKeyword"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  中文 SEO 關鍵字
                </label>
                <input
                  id="focusKeyword"
                  {...register("focusKeyword")}
                  onChange={(e) => {
                    register("focusKeyword").onChange(e);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="focusKeywordEn"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  英文 SEO 關鍵字
                </label>
                <input
                  id="focusKeywordEn"
                  {...register("focusKeywordEn")}
                  onChange={(e) => {
                    register("focusKeywordEn").onChange(e);
                    markDirty();
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <ExternalImageUrlField
              id="coverImage"
              label="封面圖 URL（外部連結）"
              value={watch("coverImage") ?? ""}
              onChange={(url) => {
                setValue("coverImage", url, { shouldValidate: true });
                markDirty();
              }}
              uploadFolder="cms/post-covers"
              previewAlt={watch("coverImageAlt") || "封面預覽"}
            />
            {errors.coverImage && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.coverImage.message}
              </p>
            )}

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
              <BlurHashField
                id="coverImageBlurHash"
                label="封面 BlurHash（選填）"
                value={watch("coverImageBlurHash") ?? ""}
                onChange={(v) => {
                  setValue("coverImageBlurHash", v, { shouldValidate: true });
                  markDirty();
                }}
              />
              {errors.coverImageBlurHash ? (
                <p className="text-xs text-red-600">
                  {String(errors.coverImageBlurHash.message)}
                </p>
              ) : null}
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

            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-4">
              <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <Calendar size={16} aria-hidden />
                排程發布
              </p>
              <div>
                <label htmlFor="scheduledAt" className="mb-1.5 block text-sm text-gray-600">
                  發布時間（選填；排程發布時必填，未填則立即發布）
                </label>
                <input
                  id="scheduledAt"
                  type="datetime-local"
                  disabled={readOnly}
                  {...register("scheduledAt")}
                  onChange={(e) => {
                    register("scheduledAt").onChange(e);
                    markDirty();
                  }}
                  className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-4">
              <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <Lock size={16} aria-hidden />
                存取設定
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  {...register("isPasswordProtected")}
                  onChange={(e) => {
                    register("isPasswordProtected").onChange(e);
                    markDirty();
                  }}
                />
                啟用密碼保護（讀者需輸入密碼才能閱讀全文）
              </label>
              {post.hasAccessPassword && (
                <p className="text-xs text-gray-500">目前已設定密碼；留空則沿用原密碼。</p>
              )}
              <div>
                <label htmlFor="accessPassword" className="mb-1.5 block text-sm text-gray-600">
                  {post.hasAccessPassword ? "新密碼（選填）" : "文章密碼"}
                </label>
                <input
                  id="accessPassword"
                  type="password"
                  disabled={readOnly}
                  value={accessPassword}
                  onChange={(e) => {
                    setAccessPassword(e.target.value);
                    markDirty();
                  }}
                  className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                  autoComplete="new-password"
                />
              </div>
              {post.hasAccessPassword && (
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={clearAccessPassword}
                    onChange={(e) => {
                      setClearAccessPassword(e.target.checked);
                      markDirty();
                    }}
                  />
                  移除密碼保護
                </label>
              )}
            </div>

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

            <div role="group" aria-labelledby="editor-zh-label">
              <p id="editor-zh-label" className="mb-1.5 block text-sm font-medium text-gray-700">
                HTML 內容編輯器（繁中）
                <span aria-hidden="true" className="text-red-500">*</span>
              </p>
              <RichTextEditor
                ref={editorZhRef}
                content={contentZh}
                onChange={(v) => { setContentZh(v); markDirty(); }}
                placeholder="開始撰寫文章內容…"
              />
            </div>

            <div role="group" aria-labelledby="editor-en-label">
              <p id="editor-en-label" className="mb-1.5 block text-sm font-medium text-gray-700">
                HTML 內容編輯器（英文，選填）
              </p>
              <RichTextEditor
                ref={editorEnRef}
                content={contentEn}
                onChange={(v) => { setContentEn(v); markDirty(); }}
                placeholder="Write English content here…"
                modeLabels={{ visual: "Visual editor", source: "HTML source" }}
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

        <div
          id="panel-seo"
          role="tabpanel"
          hidden={activeTab !== "seo"}
        >
          <SeoPanel
            postId={post.id}
            initialSeo={post.seo}
            syncFrom={seoSyncFrom}
            readOnly={readOnly}
          />
        </div>

      </div>
    </div>
  );
}

