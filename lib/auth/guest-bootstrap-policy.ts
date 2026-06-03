const WEAK_GUEST_PASSWORDS = new Set([
  "guest123",
  "guest001",
  "password",
  "guest",
  "12345678",
  "admin123",
]);

const MIN_PRODUCTION_LENGTH = 12;

export class GuestBootstrapSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuestBootstrapSecurityError";
  }
}

/** 開發環境預設；生產必須由 GUEST_BOOTSTRAP_PASSWORD 提供 */
export function resolveGuestBootstrapPassword(): string | null {
  const fromEnv = process.env["GUEST_BOOTSTRAP_PASSWORD"]?.trim();
  if (fromEnv) return fromEnv;
  if (process.env["NODE_ENV"] === "production") return null;
  return "guest123";
}

/** 生產環境：拒絕弱密碼或過短密碼（新建 GUEST 帳號前呼叫） */
export function assertGuestBootstrapPasswordAllowed(password: string): void {
  if (process.env["NODE_ENV"] !== "production") return;

  if (!password || password.length < MIN_PRODUCTION_LENGTH) {
    throw new GuestBootstrapSecurityError(
      `GUEST_BOOTSTRAP_PASSWORD must be at least ${MIN_PRODUCTION_LENGTH} characters in production`
    );
  }

  if (WEAK_GUEST_PASSWORDS.has(password.toLowerCase())) {
    throw new GuestBootstrapSecurityError(
      "GUEST_BOOTSTRAP_PASSWORD is a known weak default; set a unique secret via environment"
    );
  }
}

export function isWeakGuestPassword(password: string): boolean {
  return (
    password.length < MIN_PRODUCTION_LENGTH ||
    WEAK_GUEST_PASSWORDS.has(password.toLowerCase())
  );
}
