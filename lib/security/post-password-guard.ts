import { checkRateLimit, rateLimitKeyIp } from "@/lib/security/rate-limit";
import { incrementRateLimitCounter } from "@/lib/security/rate-limit-counter";

/** 每 slug + IP：15 分鐘內最多嘗試次數（含失敗） */
const ATTEMPT_LIMIT = 10;
const ATTEMPT_WINDOW_SEC = 15 * 60;

const FAILURE_WINDOW_SEC = 60 * 60;
const MAX_DELAY_MS = 8_000;
const BASE_DELAY_MS = 350;

function normalizeSlug(slug: string): string {
  return slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 200);
}

function attemptKey(slug: string, ip: string): string {
  return rateLimitKeyIp(ip, `post-pw:${normalizeSlug(slug)}`);
}

function failureKey(slug: string, ip: string): string {
  return rateLimitKeyIp(ip, `post-pw-fail:${normalizeSlug(slug)}`);
}

export async function assertPostPasswordAttemptAllowed(
  slug: string,
  ip: string
): Promise<{ allowed: true } | { allowed: false }> {
  const rl = await checkRateLimit(attemptKey(slug, ip), ATTEMPT_LIMIT, ATTEMPT_WINDOW_SEC);
  if (!rl.allowed) return { allowed: false };
  return { allowed: true };
}

/** 密碼錯誤後指數退避延遲（拉高暴力破解成本） */
export async function delayAfterPostPasswordFailure(
  slug: string,
  ip: string
): Promise<void> {
  const fails = await incrementRateLimitCounter(
    failureKey(slug, ip),
    FAILURE_WINDOW_SEC
  );
  const exponent = Math.min(Math.max(fails - 1, 0), 5);
  const delayMs = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** exponent);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
