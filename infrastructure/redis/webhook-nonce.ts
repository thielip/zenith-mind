// infrastructure/redis/webhook-nonce.ts
// Webhook Nonce 防重放攻擊
// redis.set NX：同一 Nonce 只能使用一次，300 秒內有效

import { redis } from "./client";

/**
 * 驗證並消耗 Nonce（原子操作，防競態）
 * @returns true = 新 Nonce（合法）| false = 已用過（重放攻擊）
 */
export async function consumeWebhookNonce(nonce: string): Promise<boolean> {
  const key = `nonce:${nonce}`;
  // NX = 只在 key 不存在時才設定（原子操作）
  const result = await redis.set(key, "1", { nx: true, ex: 300 });
  return result !== null;
}
