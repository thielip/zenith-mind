/** 後台 Access JWT 有效時間（與 cookie maxAge 一致） */
export const ACCESS_TOKEN_JWT_EXPIRES = "1h" as const;

/** Access cookie maxAge（秒）— 1 小時 */
export const ACCESS_TOKEN_COOKIE_MAX_AGE_SEC = 60 * 60;

/** Refresh cookie maxAge（秒）— 7 天 */
export const REFRESH_TOKEN_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;

/** Access 剩餘時間低於此值（秒）時主動 refresh */
export const REFRESH_BEFORE_EXPIRY_SEC = 5 * 60;

/** 背景 ping 間隔（毫秒） */
export const SESSION_PING_INTERVAL_MS = 2 * 60 * 1000;

/** 後台無操作超過此時間（毫秒）則導向登入 — 1 小時 */
export const ADMIN_IDLE_TIMEOUT_MS = 60 * 60 * 1000;
