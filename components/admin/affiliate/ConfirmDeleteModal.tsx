"use client";

interface ConfirmDeleteModalProps {
  open: boolean;
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export default function ConfirmDeleteModal({
  open,
  name,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-labelledby="aff-delete-title"
        aria-describedby="aff-delete-desc"
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 id="aff-delete-title" className="text-lg font-bold text-gray-900">
          確定要刪除聯盟連結？
        </h2>
        <p id="aff-delete-desc" className="mt-2 text-sm text-gray-600">
          確定要刪除「{name}」的聯盟連結嗎？此操作無法復原。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "刪除中…" : "確定刪除"}
          </button>
        </div>
      </div>
    </div>
  );
}
