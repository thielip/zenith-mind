/** BlurHash 使用 base83 字元集（不含中文） */
const BLURHASH_CHARSET = /^[\dA-Za-z#$%*+\-.,:;=?@[\]^_{|}~]+$/;

const CJK_PATTERN = /[\u3000-\u9FFF\uF900-\uFAFF]/;

export const BLURHASH_FORMAT_ERROR =
  "BlurHash 格式不正確，請貼上標準英數編碼字串（不可含中文）";

export function containsCjk(text: string): boolean {
  return CJK_PATTERN.test(text);
}

/** 空字串視為有效（選填欄位） */
export function isValidBlurHash(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (containsCjk(v)) return false;
  if (v.length < 6 || v.length > 200) return false;
  return BLURHASH_CHARSET.test(v);
}

/** 輸入時移除 CJK，避免誤貼中文 */
export function stripCjkFromBlurHashInput(value: string): string {
  return value.replace(CJK_PATTERN, "");
}
