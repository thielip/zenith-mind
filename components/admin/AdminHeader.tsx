// components/admin/AdminHeader.tsx — Server Component

interface Props {
  userEmail: string;
}

export default function AdminHeader({ userEmail }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* 跳過導覽連結（WCAG）*/}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-1 focus:text-sm focus:shadow focus:ring-2 focus:ring-blue-500"
      >
        跳至主要內容
      </a>

      <p className="text-sm font-medium text-gray-700">後台管理系統</p>

      <section className="flex items-center gap-3 text-sm text-gray-500" aria-label="目前登入資訊">
        <a
          href="/zh-TW"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          回前台
        </a>
        <span aria-label={`目前登入：${userEmail}`}>{userEmail}</span>
      </section>
    </header>
  );
}
