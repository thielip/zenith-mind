/** 登入表單共用邏輯（Server/Client 皆可 import 測試） */

export function safeRedirectPath(path: string | undefined): string {
  if (!path || !path.startsWith("/admin")) return "/admin/dashboard";
  if (path.startsWith("//")) return "/admin/dashboard";
  return path;
}

export function loginErrorMessage(code: string | undefined): string {
  switch (code) {
    case "AUTH_FAILED":
      return "Email 或密碼錯誤";
    case "RATE_LIMIT":
      return "嘗試次數過多，請稍後再試";
    case "VALIDATION_ERROR":
      return "請檢查 Email 與密碼格式";
    default:
      return "登入失敗，請稍後再試";
  }
}
