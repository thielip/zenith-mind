"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteMediaItemAction } from "@/actions/media.actions";

interface Props {
  source: "logo" | "hero" | "carousel" | "postCover";
  url: string;
  entityId?: string;
}

export default function MediaDeleteButton({ source, url, entityId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm(
      "確定要刪除這張圖片嗎？系統會同步移除前台引用，避免破圖。"
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteMediaItemAction({ source, url, entityId });
      if (!result.success) {
        window.alert("刪除失敗，請確認登入狀態或稍後再試。");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isPending}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 size={14} aria-hidden="true" />
      {isPending ? "刪除中" : "刪除圖片"}
    </button>
  );
}
