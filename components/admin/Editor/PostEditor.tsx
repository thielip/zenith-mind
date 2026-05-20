// components/admin/Editor/PostEditor.tsx ??Client Component
// ??蝺刻摩?其蜓擃?Tiptap + SEO ?Ｘ

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
import ExternalImageUrlField from "@/components/admin/ExternalImageUrlField";
import { optionalExternalImageUrlSchema } from "@/lib/validation/external-image-url";

// ?? ? ??????????????????????????????????????????????????

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

// ?? Zod Schema ?????????????????????????????????????????????

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
  titleEn:     z.string().max(200).optional(),
  excerpt:     z.string().max(300).optional(),
  excerptEn:   z.string().max(300).optional(),
  categoryId:  z.string().optional(),
  coverImage: optionalExternalImageUrlSchema,
  coverImageAlt: z.string().max(300).optional(),
  coverImageWidth: optionalPositiveInt,
  coverImageHeight: optionalPositiveInt,
  coverImageBlurHash: z.string().max(200).optional(),
  scheduledAt: z.string().optional(),
  isPasswordProtected: z.boolean().optional(),
  accessPassword: z.string().max(128).optional(),
  clearAccessPassword: z.boolean().optional(),
});

type PostFormInput = z.input<typeof formSchema>;
type PostFormParsed = z.output<typeof formSchema>;

// ?? ?辣 ??????????????????????????????????????????????????

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

  // 璅???脣?鞈?嚗ilentRefresh beforeunload ?剁?
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
    { id: "content" as const, label: "?批捆蝺刻摩" },
    { id: "faq"     as const, label: "FAQ 蝺刻摩" },
    { id: "seo"     as const, label: "SEO 閮剖?" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* ?撌亙??*/}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">
          編輯：{post.title}
        </h1>
        <div className="flex items-center gap-2">
          {/* ?脣????蝷?*/}
          {saveStatus === "saved" && (
            <span className="text-xs text-green-600" aria-live="polite">
              ??撌脣摮?            </span>
          )}
          {saveStatus === "published" && (
            <span className="text-xs text-green-600" aria-live="polite">
              ???澆?摰?嚗迤?刻???蝡恣??            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-red-600" aria-live="assertive">
              ?脣?憭望?嚗??岫
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

      {/* Tab ?? */}
      <div
        role="tablist"
        aria-label="蝺刻摩?Ｘ"
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

      {/* Tab ?Ｘ */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* ?批捆蝺刻摩 */}
        <div
          id="panel-content"
          role="tabpanel"
          aria-labelledby="tab-content"
          hidden={activeTab !== "content"}
        >
          <div className="space-y-4">
            {/* 璅? */}
            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                璅?嚗?銝哨?<span aria-hidden="true" className="text-red-500">*</span>
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
                ??嚗???望??”?＊蝷綽?
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

            {/* 璅?嚗??*/}
            <div>
              <label
                htmlFor="titleEn"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                璅?嚗??
              </label>
              <input
                id="titleEn"
                {...register("titleEn")}
                onChange={(e) => { register("titleEn").onChange(e); markDirty(); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* ?? */}
            <div>
              <label
                htmlFor="excerpt"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                ??嚗?銝哨??”?＊蝷綽?
              </label>
              <textarea
                id="excerpt"
                rows={2}
                {...register("excerpt")}
                onChange={(e) => { register("excerpt").onChange(e); markDirty(); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <ExternalImageUrlField
              id="coverImage"
              label="封面圖 URL（外部連結）"
              value={watch("coverImage") ?? ""}
              onChange={(url) => {
                setValue("coverImage", url, { shouldValidate: true });
                markDirty();
              }}
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
                  撠 Alt嚗EO / a11y嚗?                </label>
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
                  撠 BlurHash嚗憛恬?
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
                  撠撖穿?px嚗?                </label>
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
                ?撣?蝔?              </p>
              <div>
                <label htmlFor="scheduledAt" className="mb-1.5 block text-sm text-gray-600">
                  ?澆???嚗??蝔撣?敹‵嚗??箸靘???
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
                ????
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
                ?撖Ⅳ靽風嚗???頛詨撖Ⅳ????
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
                  蝘駁撖Ⅳ靽風
                </label>
              )}
            </div>

            {/* ?? */}
            <div>
              <label
                htmlFor="categoryId"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                ??
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

            {/* 蝜葉?批捆蝺刻摩??*/}
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

            {/* ?望??批捆蝺刻摩??*/}
            <div role="group" aria-labelledby="editor-en-label">
              <p id="editor-en-label" className="mb-1.5 block text-sm font-medium text-gray-700">
                HTML 蝬脤??批捆蝺刻摩?剁??望?嚗憛恬?
              </p>
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

        {/* SEO 閮剖? */}
        <div
          id="panel-seo"
          role="tabpanel"
          hidden={activeTab !== "seo"}
        >
          <SeoPanel postId={post.id} initialSeo={post.seo} readOnly={readOnly} />
        </div>

      </div>
    </div>
  );
}

