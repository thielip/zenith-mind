// infrastructure/redis/token-blacklist.ts
// Refresh Token 黑名單（Level 3：登出時 1 次寫入，每次 refresh 1 次查詢）
// Redis 查詢量：從「每次請求 1 次」→「每次 refresh 1 次」，減少 ~95%

import { redis } from "./client";

const PREFIX = "rt:blacklist:";
const TTL    = 7 * 24 * 60 * 60; // 7 天（與 Refresh Token 有效期一致）

/** 登出時寫入（1 次 Redis 寫入）*/
export async function blacklistRefreshToken(tokenId: string): Promise<void> {
  await redis.set(`${PREFIX}${tokenId}`, "1", { ex: TTL });
}

/** Silent Refresh 時查詢（每次 refresh 1 次）*/
export async function isRefreshTokenBlacklisted(
  tokenId: string
): Promise<boolean> {
  const result = await redis.get(`${PREFIX}${tokenId}`);
  return result !== null;
}
