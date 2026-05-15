// domain/shared/core.types.ts
// 全域通訊協議：ActionResult<T>（語意強化版）
// retryable 讓 Queue Worker 自動決定是否重試
// httpStatus 讓 API Layer 直接對應 HTTP 回應碼

export interface ActionError {
  code: string;        // 機器讀取（如 'AUTH_FAILED'）
  message: string;     // 開發者除錯用（不暴露至前端）
  details?: unknown;   // 結構化資訊（如 ZodError.flatten()）
  httpStatus?: number; // 供 API Layer 對應（401, 429, 500）
  retryable: boolean;  // Queue Worker 是否自動重試
  severity: "info" | "warn" | "fatal";
}

export type ActionResult<T = void> =
  | { success: true;  data: T;    error: null }
  | { success: false; data: null; error: ActionError };

// ── 預設錯誤碼常數 ─────────────────────────────────────

export const Errors = {
  validation: (details?: unknown): ActionError => ({
    code: "VALIDATION_ERROR",
    message: "Input validation failed",
    details,
    httpStatus: 400,
    retryable: false,
    severity: "info",
  }),
  auth: (): ActionError => ({
    code: "AUTH_FAILED",
    message: "Authentication failed",
    httpStatus: 401,
    retryable: false,
    severity: "warn",
  }),
  forbidden: (): ActionError => ({
    code: "FORBIDDEN",
    message: "Access denied",
    httpStatus: 403,
    retryable: false,
    severity: "warn",
  }),
  notFound: (entity?: string): ActionError => ({
    code: "NOT_FOUND",
    message: entity ? `${entity} not found` : "Resource not found",
    httpStatus: 404,
    retryable: false,
    severity: "info",
  }),
  rateLimit: (): ActionError => ({
    code: "RATE_LIMIT",
    message: "Too many requests",
    httpStatus: 429,
    retryable: true,
    severity: "warn",
  }),
  totpInvalid: (): ActionError => ({
    code: "TOTP_INVALID",
    message: "Invalid TOTP code",
    httpStatus: 401,
    retryable: false,
    severity: "warn",
  }),
  totpRequired: (): ActionError => ({
    code: "TOTP_REQUIRED",
    message: "TOTP verification required",
    httpStatus: 401,
    retryable: false,
    severity: "info",
  }),
  duplicate: (field?: string): ActionError => ({
    code: "DUPLICATE_ERROR",
    message: field ? `${field} already exists` : "Duplicate entry",
    httpStatus: 409,
    retryable: false,
    severity: "info",
  }),
  aiRateLimit: (): ActionError => ({
    code: "AI_RATE_LIMIT",
    message: "AI provider rate limited",
    httpStatus: 429,
    retryable: true,   // Queue 會 exponential backoff 重試
    severity: "warn",
  }),
  aiTimeout: (): ActionError => ({
    code: "AI_TIMEOUT",
    message: "AI provider timeout",
    httpStatus: 504,
    retryable: true,
    severity: "warn",
  }),
  aiFormat: (): ActionError => ({
    code: "AI_FORMAT_ERROR",
    message: "AI response format invalid",
    httpStatus: 500,
    retryable: false,  // Self-Correction 一次後仍失敗 → FATAL
    severity: "fatal",
  }),
  internal: (requestId?: string): ActionError => ({
    code: "INTERNAL_ERROR",
    message: requestId
      ? `Internal error [${requestId}]`
      : "Internal server error",
    httpStatus: 500,
    retryable: false,
    severity: "fatal",
  }),
} as const;

// ── API Response 統一格式（含全鏈路追蹤）────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ActionError | null;
  trace: {
    requestId: string;
    jobId?: string;
    spanId?: string;
  };
}
