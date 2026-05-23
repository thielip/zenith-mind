import { z } from "zod";
import {
  isBlockedImageHost,
  UNRELIABLE_IMAGE_HOST_HINT,
} from "@/lib/validation/blocked-image-hosts";

/** 路徑結尾須為常見點陣圖副檔名（不含 query） */
const IMAGE_PATH_EXT = /\.(jpe?g|png|webp)$/i;

export const EXTERNAL_IMAGE_URL_HINT =
  "請輸入以 http:// 或 https:// 開頭，且路徑結尾為 .jpg、.jpeg、.png 或 .webp 的圖片網址";

export type ExternalImageUrlCheck = {
  valid: boolean;
  error?: string;
  /** 格式合法但圖床可能無法 hotlink */
  warning?: string;
};

/** 僅檢查 URL 格式（協定、副檔名），不封鎖特定網域 */
export function isValidExternalImageUrl(value: string): boolean {
  return checkExternalImageUrl(value).valid;
}

/**
 * 外部圖片連結（Hotlink）：http(s) + 圖片副檔名；不可靠圖床僅回傳 warning。
 */
export function checkExternalImageUrl(value: string): ExternalImageUrlCheck {
  const v = value.trim();
  if (!v) return { valid: false, error: EXTERNAL_IMAGE_URL_HINT };
  if (!/^https?:\/\//i.test(v)) {
    return { valid: false, error: EXTERNAL_IMAGE_URL_HINT };
  }
  try {
    const parsed = new URL(v);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: EXTERNAL_IMAGE_URL_HINT };
    }
    if (!IMAGE_PATH_EXT.test(parsed.pathname)) {
      return { valid: false, error: EXTERNAL_IMAGE_URL_HINT };
    }
    if (isBlockedImageHost(parsed.hostname)) {
      return { valid: true, warning: UNRELIABLE_IMAGE_HOST_HINT };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: EXTERNAL_IMAGE_URL_HINT };
  }
}

export const requiredExternalImageUrlSchema = z
  .string()
  .trim()
  .min(1, EXTERNAL_IMAGE_URL_HINT)
  .max(2000)
  .refine(isValidExternalImageUrl, { message: EXTERNAL_IMAGE_URL_HINT });

export const optionalExternalImageUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => !v || isValidExternalImageUrl(v), {
    message: EXTERNAL_IMAGE_URL_HINT,
  });
