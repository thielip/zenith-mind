"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ExternalLink, Copy, Search } from "lucide-react";
import {
  createAffiliateLinkAction,
  deleteAffiliateLinkAction,
  toggleAffiliateLinkActiveAction,
  updateAffiliateLinkAction,
} from "@/actions/affiliate.actions";
import AdminToast from "@/components/admin/affiliate/AdminToast";
import AffiliateClickSparkline from "@/components/admin/affiliate/AffiliateClickSparkline";
import ConfirmDeleteModal from "@/components/admin/affiliate/ConfirmDeleteModal";
import ToggleSwitch from "@/components/admin/affiliate/ToggleSwitch";
import type { AffiliateLinkAdminRow } from "@/lib/affiliate/load-affiliate-admin";
import { AFFILIATE_PLATFORM_TAGS } from "@/lib/affiliate/platform-tags";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  initialLinks: AffiliateLinkAdminRow[];
}

const linkSchema = z.object({
  name: z.string().min(1, "名稱必填").max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "只能包含小寫英文、數字、連字號"),
  targetUrl: z.string().url("請輸入有效的 URL"),
  platform: z.string().max(50).optional(),
  commission: z.string().max(50).optional(),
});

const editLinkSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "名稱必填").max(100),
  targetUrl: z.string().url("請輸入有效的 URL"),
  platform: z.string().max(50).optional(),
  commission: z.string().max(50).optional(),
  isActive: z.boolean(),
});

type LinkForm = z.infer<typeof linkSchema>;
type EditLinkForm = z.infer<typeof editLinkSchema>;

function PlatformSelect({
  id,
  register,
}: {
  id: string;
  register: ReturnType<typeof useForm<LinkForm>>["register"];
}) {
  return (
    <select
      id={id}
      {...register("platform")}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="">選擇平台標籤…</option>
      {AFFILIATE_PLATFORM_TAGS.map((tag) => (
        <option key={tag} value={tag}>
          {tag}
        </option>
      ))}
    </select>
  );
}

export default function AffiliateManager({ initialLinks }: Props) {
  const router = useRouter();
  const [links, setLinks] = useState<AffiliateLinkAdminRow[]>(initialLinks);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [editErrorMsg, setEditErrorMsg] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null
  );
  const [keyword, setKeyword] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  const platformOptions = useMemo(() => {
    const fromLinks = links.map((l) => l.platform).filter(Boolean);
    return [...new Set([...AFFILIATE_PLATFORM_TAGS, ...fromLinks])].filter(Boolean);
  }, [links]);

  const filteredLinks = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return links.filter((link) => {
      if (platformFilter && link.platform !== platformFilter) return false;
      if (!q) return true;
      return (
        link.name.toLowerCase().includes(q) ||
        link.slug.toLowerCase().includes(q) ||
        `/go/${link.slug}`.includes(q)
      );
    });
  }, [links, keyword, platformFilter]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
  });

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

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  async function copyShortUrl(slug: string) {
    try {
      await navigator.clipboard.writeText(`${siteUrl}/go/${slug}`);
      showToast("✓ 已複製短網址至剪貼簿");
    } catch {
      showToast("複製失敗，請手動選取網址");
    }
  }

  const onSubmit = handleSubmit((values) => {
    setErrorMsg("");
    startTransition(async () => {
      const result = await createAffiliateLinkAction(values);
      if (result.success) {
        setLinks((prev) => [
          {
            ...result.data,
            todayClicks: 0,
            last7Days: [0, 0, 0, 0, 0, 0, 0],
          },
          ...prev,
        ]);
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
        setLinks((prev) =>
          prev.map((l) =>
            l.id === result.data.id
              ? { ...l, ...result.data }
              : l
          )
        );
        setEditingId(null);
        editForm.reset();
        router.refresh();
      } else {
        setEditErrorMsg("更新失敗，請重試");
      }
    });
  });

  function openEdit(link: AffiliateLinkAdminRow) {
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

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteAffiliateLinkAction(deleteTarget.id);
      if (result.success) {
        setLinks((prev) => prev.filter((l) => l.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    });
  }

  function handleToggleActive(link: AffiliateLinkAdminRow, next: boolean) {
    startTransition(async () => {
      const result = await toggleAffiliateLinkActiveAction(link.id, next);
      if (result.success) {
        setLinks((prev) =>
          prev.map((l) => (l.id === link.id ? { ...l, isActive: next } : l))
        );
        router.refresh();
      }
    });
  }

  return (
    <TooltipProvider>
      <AdminToast message={toast} onDismiss={() => setToast(null)} />

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        name={deleteTarget?.name ?? ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isPending={isPending}
      />

      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
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
            <Plus size={15} aria-hidden />
            新增連結
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1">
            <span className="mb-1 block text-xs font-semibold text-gray-600">
              關鍵字（名稱或短網址）
            </span>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜尋名稱、slug…"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </label>
          <label className="block w-full sm:w-48">
            <span className="mb-1 block text-xs font-semibold text-gray-600">
              平台／分類
            </span>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">全部分類</option>
              {platformOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
          {(keyword || platformFilter) && (
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setPlatformFilter("");
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              顯示全部
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-6"
            aria-label="新增聯盟連結"
            noValidate
          >
            <h2 className="text-sm font-semibold text-blue-900">新增聯盟連結</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="aff-name" className="mb-1 block text-xs font-medium text-gray-700">
                  顯示名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  id="aff-name"
                  {...register("name")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {errors.name && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="aff-slug" className="mb-1 block text-xs font-medium text-gray-700">
                  短網址 Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <span className="shrink-0 text-xs text-gray-400">/go/</span>
                  <input
                    id="aff-slug"
                    {...register("slug")}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                  />
                </div>
                {errors.slug && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.slug.message}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="aff-url" className="mb-1 block text-xs font-medium text-gray-700">
                  目標 URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="aff-url"
                  type="url"
                  {...register("targetUrl")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {errors.targetUrl && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.targetUrl.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="aff-platform" className="mb-1 block text-xs font-medium text-gray-700">
                  平台標籤
                </label>
                <PlatformSelect id="aff-platform" register={register} />
              </div>
              <div>
                <label htmlFor="aff-commission" className="mb-1 block text-xs font-medium text-gray-700">
                  佣金說明
                </label>
                <input
                  id="aff-commission"
                  {...register("commission")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            {errorMsg && <p role="alert" className="text-sm text-red-600">{errorMsg}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
            <input type="hidden" {...editForm.register("id")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="edit-aff-name" className="mb-1 block text-xs font-medium text-gray-700">
                  顯示名稱
                </label>
                <input
                  id="edit-aff-name"
                  {...editForm.register("name")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="edit-aff-url" className="mb-1 block text-xs font-medium text-gray-700">
                  目標 URL
                </label>
                <input
                  id="edit-aff-url"
                  type="url"
                  {...editForm.register("targetUrl")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="edit-aff-platform" className="mb-1 block text-xs font-medium text-gray-700">
                  平台標籤
                </label>
                <select
                  id="edit-aff-platform"
                  {...editForm.register("platform")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">未分類</option>
                  {AFFILIATE_PLATFORM_TAGS.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-aff-commission" className="mb-1 block text-xs font-medium text-gray-700">
                  佣金說明
                </label>
                <input
                  id="edit-aff-commission"
                  {...editForm.register("commission")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            {editErrorMsg && <p role="alert" className="text-sm text-red-600">{editErrorMsg}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={closeEdit} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                取消
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isPending ? "儲存中…" : "儲存變更"}
              </button>
            </div>
          </form>
        )}

        <p className="text-sm text-gray-500">
          顯示 {filteredLinks.length.toLocaleString()} / {links.length.toLocaleString()} 筆連結
          <span className="ml-2 text-xs text-gray-400">（點擊欄：今日 / 累計 · 近 7 日折線）</span>
        </p>

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
              {filteredLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{link.name}</p>
                    {link.commission ? (
                      <p className="text-xs text-gray-400">{link.commission}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        /go/{link.slug}
                      </code>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => void copyShortUrl(link.slug)}
                            aria-label={`複製 ${link.name} 短網址`}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Copy size={14} aria-hidden />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>複製短網址</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {link.platform ? (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800">
                        {link.platform}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <AffiliateClickSparkline
                      series={link.last7Days}
                      todayClicks={link.todayClicks}
                      totalClicks={link.clickCount}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ToggleSwitch
                      checked={link.isActive}
                      onChange={(next) => handleToggleActive(link, next)}
                      disabled={isPending}
                      label={`${link.isActive ? "停用" : "啟用"} ${link.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => openEdit(link)}
                            disabled={isPending}
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
                          >
                            <Pencil size={15} aria-hidden />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>編輯</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={`/go/${link.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <ExternalLink size={15} aria-hidden />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>前往短網址（前台轉址）</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: link.id, name: link.name })}
                            disabled={isPending}
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 size={15} aria-hidden />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>刪除</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLinks.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              {links.length === 0
                ? "尚無聯盟連結，請點擊「新增連結」建立。"
                : "找不到符合篩選條件的連結。"}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
