"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Copy, Grid3X3, List } from "lucide-react";
import MediaDeleteButton from "@/components/admin/MediaDeleteButton";
import {
  MEDIA_FILTER_TABS,
  MEDIA_TYPE_LABELS,
  type MediaLibraryItem,
  type MediaSourceType,
} from "@/lib/admin/media-library";
import { isNextImageRemoteUrl } from "@/lib/images/next-image-host";
import { cn } from "@/shared/lib/cn";

interface Props {
  items: MediaLibraryItem[];
}

function MediaThumb({ item }: { item: MediaLibraryItem }) {
  if (isNextImageRemoteUrl(item.url)) {
    return (
      <Image
        src={item.url}
        alt={item.title}
        fill
        unoptimized={item.url.endsWith(".svg")}
        sizes="(min-width: 1280px) 15rem, (min-width: 1024px) 20vw, 25vw"
        className="object-cover"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.url}
      alt={item.title}
      className="absolute inset-0 h-full w-full object-cover"
      loading="lazy"
      decoding="async"
    />
  );
}

function StorageBadge({ storage }: { storage: MediaLibraryItem["storage"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        storage === "supabase"
          ? "bg-blue-100 text-blue-800"
          : "bg-orange-100 text-orange-800"
      )}
    >
      {storage === "supabase" ? "系統內建" : "外部網址"}
    </span>
  );
}

export default function MediaLibraryManager({ items }: Props) {
  const [filter, setFilter] = useState<"all" | MediaSourceType>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.sourceType === filter);
  }, [items, filter]);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
        尚無媒體資料。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {MEDIA_FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{filtered.length} 項</span>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "rounded-lg p-2",
              view === "grid" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
            )}
            aria-label="格狀檢視"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "rounded-lg p-2",
              view === "list" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
            )}
            aria-label="清單檢視"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item, index) => (
            <article
              key={`${item.url}-${index}`}
              className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                  {MEDIA_TYPE_LABELS[item.sourceType]}
                </span>
                <StorageBadge storage={item.storage} />
              </div>
              <h2 className="line-clamp-1 px-3 text-sm font-semibold text-gray-900">
                {item.title}
              </h2>
              <div className="relative mx-3 mb-3 mt-2 aspect-video overflow-hidden rounded-lg bg-gray-100">
                <MediaThumb item={item} />
              </div>
              <div className="mt-auto space-y-2 border-t border-gray-100 px-3 py-3">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 break-all text-[10px] leading-snug text-gray-500">
                    {item.url}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyUrl(item.url)}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                    title="複製連結"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {copied === item.url ? (
                  <p className="text-[10px] text-emerald-600">已複製</p>
                ) : null}
                <div className="flex justify-end">
                  <MediaDeleteButton
                    source={item.sourceType}
                    url={item.url}
                    entityId={item.entityId}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-2 font-medium">縮圖</th>
                <th className="px-4 py-2 font-medium">名稱</th>
                <th className="px-4 py-2 font-medium">類型</th>
                <th className="px-4 py-2 font-medium">來源</th>
                <th className="px-4 py-2 font-medium">網址</th>
                <th className="px-4 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={`${item.url}-${index}`} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <div className="relative h-12 w-20 overflow-hidden rounded bg-gray-100">
                      <MediaThumb item={item} />
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">{item.title}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {MEDIA_TYPE_LABELS[item.sourceType]}
                  </td>
                  <td className="px-4 py-2">
                    <StorageBadge storage={item.storage} />
                  </td>
                  <td className="max-w-xs px-4 py-2">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs text-gray-500">{item.url}</span>
                      <button
                        type="button"
                        onClick={() => copyUrl(item.url)}
                        className="shrink-0 text-gray-400 hover:text-blue-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <MediaDeleteButton
                      source={item.sourceType}
                      url={item.url}
                      entityId={item.entityId}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
