"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePostAction } from "@/actions/post.actions";

interface Props {
  postId: string;
  title: string;
}

export default function PostDeleteButton({ postId, title }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`確定要刪除「${title}」嗎？文章會封存並建立 SEO 轉址。`)) return;

    startTransition(async () => {
      const result = await deletePostAction(postId);
      if (result.success) {
        sessionStorage.setItem("admin-posts-message", "文章已刪除");
        router.refresh();
      } else {
        window.alert("刪除失敗，請重新登入或稍後再試。");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
      aria-label={`刪除文章：${title}`}
    >
      <Trash2 size={14} aria-hidden="true" />
      刪除
    </button>
  );
}
