// components/admin/AffiliateManager.tsx — Client Component
// 聯盟連結 CRUD UI

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ExternalLink, Copy, Check } from "lucide-react";
import {
  createAffiliateLinkAction,
  deleteAffiliateLinkAction,
  updateAffiliateLinkAction,
} from "@/actions/affiliate.actions";

interface AffiliateLink {
  id:         string;
  name:       string;
  slug:       string;
  targetUrl:  string;
  platform:   string;
  commission: string;
  isActive:   boolean;
  clickCount: number;
}

interface Props {
  initialLinks: AffiliateLink[];
}

const linkSchema = z.object({
  name:       z.string().min(1, "名稱必填").max(100),
  slug:       z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "只能包含小寫英文、數字、連字號"),
  targetUrl:  z.string().url("請輸入有效的 URL"),
  platform:   z.string().max(50).optional(),
  commission: z.string().max(50).optional(),
});

const editLinkSchema = z.object({
  id:         z.string().cuid(),
  name:       z.string().min(1, "名稱必填").max(100),
  targetUrl:  z.string().url("請輸入有效的 URL"),
  platform:   z.string().max(50).optional(),
  commission: z.string().max(50).optional(),
  isActive:   z.boolean(),
});

type LinkForm = z.infer<typeof linkSchema>;
type EditLinkForm = z.infer<typeof editLinkSchema>;

export default function AffiliateManager({ initialLinks }: Props) {
  const router = useRouter();
  const [links,      setLinks]      = useState<AffiliateLink[]>(initialLinks);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [editErrorMsg, setEditErrorMsg] = useState("");
  const [copiedId,   setCopiedId]   = useState<string | null>(null);
  const [isPending,  startTransition] = useTransition();

  const siteUrl = typeof window !== "undefined"
    ? window.location.origin
    : "";

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<LinkForm>({ resolver: zodResolver(linkSchema) });

  const editForm = useForm<EditLinkForm>({
    resolver: zodResolver(editLinkSchema),
    defaultValues: {
      id: "",
      name: "",
      targetUrl: "",
      platform: "",
      commission: "",
      isActive: true,
    },
  });

  // ── 複製短網址 ──────────────────────────────────────────

  async function copyShortUrl(slug: string, id: string) {
    await navigator.clipboard.writeText(`${siteUrl}/go/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // ── 新增 ────────────────────────────────────────────────

  const onSubmit = handleSubmit((values) => {
    setErrorMsg("");
    startTransition(async () => {
      const result = await createAffiliateLinkAction(values);
      if (result.success) {
        setLinks((prev) => [result.data, ...prev]);
        reset();
        setShowForm(false);
        router.refresh();
      } else {
        setErrorMsg(
          result.error.code === "DUPLICATE_ERROR"
            ? "此 slug 已被使用"
            : "建立失敗，請重試"
        );
      }
    });
  });

  const onEditSubmit = editForm.handleSubmit((values) => {
    setEditErrorMsg("");
    startTransition(async () => {
      const result = await updateAffiliateLinkAction({
        id: values.id,
        name: values.name,
        targetUrl: values.targetUrl,
        platform: values.platform?.trim() || undefined,
        commission: values.commission?.trim() || undefined,
        isActive: values.isActive,
      });
      if (result.success) {
        setLinks((prev) => prev.map((l) => (l.id === result.data.id ? result.data : l)));
        setEditingId(null);
        editForm.reset();
        router.refresh();
      } else {
        setEditErrorMsg("更新失敗，請重試");
      }
    });
  });

  function openEdit(link: AffiliateLink) {
    setShowForm(false);
    reset();
    setErrorMsg("");
    setEditErrorMsg("");
    setEditingId(link.id);
    editForm.reset({
      id: link.id,
      name: link.name,
      targetUrl: link.targetUrl,
      platform: link.platform || "",
      commission: link.commission || "",
      isActive: link.isActive,
    });
  }

  function closeEdit() {
    setEditingId(null);
    editForm.reset();
    setEditErrorMsg("");
  }

  // ── 刪除 ────────────────────────────────────────────────

  function handleDelete(id: string, name: string) {
    if (!confirm(`確定要刪除「${name}」嗎？此操作不可復原。`)) return;
    startTransition(async () => {
      const result = await deleteAffiliateLinkAction(id);
      if (result.success) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 新增按鈕 */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowForm((v) => !v);
            if (showForm) reset();
            else {
              setEditingId(null);
              editForm.reset();
              setEditErrorMsg("");
            }
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-expanded={showForm}
        >
          <Plus size={15} aria-hidden="true" />
          新增連結
        </button>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-blue-200 bg-blue-50 p-6 space-y-4"
          aria-label="新增聯盟連結"
          noValidate
        >
          <h2 className="text-sm font-semibold text-blue-900">新增聯盟連結</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="aff-name" className="mb-1 block text-xs font-medium text-gray-700">
                顯示名稱 <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="aff-name"
                {...register("name")}
                placeholder="例：Klook 台灣活動"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-required="true"
              />
              {errors.name && (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="aff-slug" className="mb-1 block text-xs font-medium text-gray-700">
                短網址 Slug <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 shrink-0">/go/</span>
                <input
                  id="aff-slug"
                  {...register("slug")}
                  placeholder="klook-tw"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-required="true"
                />
              </div>
              {errors.slug && (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="aff-url" className="mb-1 block text-xs font-medium text-gray-700">
                目標 URL <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="aff-url"
                type="url"
                {...register("targetUrl")}
                placeholder="https://www.klook.com/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-required="true"
              />
              {errors.targetUrl && (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.targetUrl.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="aff-platform" className="mb-1 block text-xs font-medium text-gray-700">
                平台
              </label>
              <input
                id="aff-platform"
                {...register("platform")}
                placeholder="Klook、KKday、Amazon"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="aff-commission" className="mb-1 block text-xs font-medium text-gray-700">
                佣金說明
              </label>
              <input
                id="aff-commission"
                {...register("commission")}
                placeholder="5% 佣金"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {errorMsg && (
            <p role="alert" className="text-sm text-red-600">{errorMsg}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); reset(); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isPending ? "建立中…" : "建立"}
            </button>
          </div>
        </form>
      )}

      {editingId && (
        <form
          onSubmit={onEditSubmit}
          className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-6"
          aria-label="編輯聯盟連結"
          noValidate
        >
          <h2 className="text-sm font-semibold text-amber-900">編輯聯盟連結</h2>
          <p className="text-xs text-gray-600">
            短網址 slug 建立後不可修改，以免已分享的 <code className="rounded bg-white px-1">/go/</code> 連結失效。
            目前：<code className="rounded bg-white px-1 font-mono text-xs">/go/{links.find((l) => l.id === editingId)?.slug}</code>
          </p>
          <input type="hidden" {...editForm.register("id")} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="edit-aff-name" className="mb-1 block text-xs font-medium text-gray-700">
                顯示名稱 <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="edit-aff-name"
                {...editForm.register("name")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {editForm.formState.errors.name && (
                <p role="alert" className="mt-1 text-xs text-red-600">{editForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="edit-aff-url" className="mb-1 block text-xs font-medium text-gray-700">
                目標 URL <span aria-hidden="true" className="text-red-500">*</span>
              </label>
              <input
                id="edit-aff-url"
                type="url"
                {...editForm.register("targetUrl")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {editForm.formState.errors.targetUrl && (
                <p role="alert" className="mt-1 text-xs text-red-600">{editForm.formState.errors.targetUrl.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="edit-aff-platform" className="mb-1 block text-xs font-medium text-gray-700">
                平台
              </label>
              <input
                id="edit-aff-platform"
                {...editForm.register("platform")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="edit-aff-commission" className="mb-1 block text-xs font-medium text-gray-700">
                佣金說明
              </label>
              <input
                id="edit-aff-commission"
                {...editForm.register("commission")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="edit-aff-active"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...editForm.register("isActive")}
              />
              <label htmlFor="edit-aff-active" className="text-sm text-gray-700">
                啟用此連結（停用後前台與短網址將無法導流）
              </label>
            </div>
          </div>

          {editErrorMsg && (
            <p role="alert" className="text-sm text-red-600">{editErrorMsg}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeEdit}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {isPending ? "儲存中…" : "儲存變更"}
            </button>
          </div>
        </form>
      )}

      {/* 連結列表 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-100 text-sm" aria-label="聯盟連結列表">
          <thead className="bg-gray-50">
            <tr>
              {["名稱", "短網址", "平台", "點擊", "狀態", "操作"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{link.name}</p>
                  {link.commission && (
                    <p className="text-xs text-gray-400">{link.commission}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      /go/{link.slug}
                    </code>
                    <button
                      onClick={() => void copyShortUrl(link.slug, link.id)}
                      aria-label={`複製 ${link.name} 短網址`}
                      className="rounded p-1 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {copiedId === link.id
                        ? <Check size={13} className="text-green-600" aria-hidden="true" />
                        : <Copy size={13} aria-hidden="true" />
                      }
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {link.platform || "—"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {link.clickCount.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${link.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {link.isActive ? "啟用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(link)}
                      disabled={isPending}
                      aria-label={`編輯 ${link.name}`}
                      className="rounded p-1 text-gray-400 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-40"
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <a
                      href={link.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`在新視窗開啟 ${link.name}`}
                      className="rounded p-1 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                    <button
                      onClick={() => handleDelete(link.id, link.name)}
                      disabled={isPending}
                      aria-label={`刪除 ${link.name}`}
                      className="rounded p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-40"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {links.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            尚無聯盟連結，請點擊「新增連結」建立。
          </div>
        )}
      </div>
    </div>
  );
}
