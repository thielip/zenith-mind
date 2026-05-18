// lib/security/revalidate-target.ts — 驗證 on-demand ISR 目標，防路徑注入與任意 tag 清除

const SAFE_TAG = /^[a-zA-Z0-9_-]{1,64}$/;
const SAFE_PATH = /^\/[a-zA-Z0-9/_\-.]*$/;

export function isValidRevalidateTag(value: string): boolean {
  return SAFE_TAG.test(value);
}

export function isValidRevalidatePath(value: string): boolean {
  if (!SAFE_PATH.test(value)) return false;
  if (value.includes("..")) return false;
  if (value.length > 256) return false;
  return true;
}

export function assertRevalidateTarget(
  type: "path" | "tag",
  value: string
): boolean {
  return type === "tag"
    ? isValidRevalidateTag(value)
    : isValidRevalidatePath(value);
}
