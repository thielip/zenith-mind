import { z } from "zod";
import { isBlockedImageHost } from "@/lib/validation/blocked-image-hosts";

/** 路徑結尾須為常見點陣圖副檔名（不含 query） */
const IMAGE_PATH_EXT = /\.(jpe?g|png|webp)$/i;

export const EXTERNAL_IMAGE_URL_HINT =
  "請輸入以 http:// 或 https:// 開頭，且路徑結尾為 .jpg、.jpeg、.png 或 .webp 的圖片網址";

/**
 * 外部圖片連結（Hotlink）：僅允許 http(s)，且 pathname 以圖片副檔名結尾。
 */
export function isValidExternalImageUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (!/^https?:\/\//i.test(v)) return false;
  try {
    const parsed = new URL(v);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (isBlockedImageHost(parsed.hostname)) {
      return false;
    }
    return IMAGE_PATH_EXT.test(parsed.pathname);
  } catch {
    return false;
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
