// components/layout/SkipToMain.tsx — WCAG：跳過導覽連結
// 放在 body 最頂端，鍵盤 Tab 第一個 focus 到此連結

export default function SkipToMain() {
  return (
    <a
      href="#main-content"
      className={[
        "sr-only focus:not-sr-only",
        "focus:fixed focus:top-4 focus:left-4 focus:z-50",
        "focus:rounded-md focus:bg-white focus:px-4 focus:py-2",
        "focus:text-sm focus:font-medium focus:text-gray-900",
        "focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
      ].join(" ")}
    >
      跳至主要內容
    </a>
  );
}
