interface Props {
  locale: string;
}

/** 資料源暫時不可用（非「站內真的沒有文章」） */
export default function PublicDataDegradedBanner({ locale }: Props) {
  const isEn = locale === "en";
  return (
    <div
      role="status"
      className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      {isEn
        ? "Content is temporarily unavailable. Please try again shortly."
        : "內容暫時無法載入，請稍後再試。（系統維護中，並非沒有文章）"}
    </div>
  );
}
