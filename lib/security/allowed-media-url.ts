// lib/security/allowed-media-url.ts — 封面／媒體 URL：外部圖片連結（Hotlink）

import {
  isValidExternalImageUrl,
  EXTERNAL_IMAGE_URL_HINT,
  optionalExternalImageUrlSchema,
} from "@/lib/validation/external-image-url";

export { EXTERNAL_IMAGE_URL_HINT };

/** @deprecated 使用 isValidExternalImageUrl；保留名稱供既有測試／呼叫端 */
export function isAllowedMediaUrl(url: string): boolean {
  if (!url) return true;
  return isValidExternalImageUrl(url);
}

export const optionalTrustedMediaUrl = optionalExternalImageUrlSchema;
