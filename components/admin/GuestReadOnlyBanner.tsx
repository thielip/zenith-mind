export default function GuestReadOnlyBanner() {
  return (
    <div
      role="status"
      className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
    >
      您目前以<strong className="mx-1 font-semibold">參訪帳號</strong>
      登入：可檢視所有後台資料，但無法儲存或修改任何內容。
    </div>
  );
}
