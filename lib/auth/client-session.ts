const ADMIN_SESSION_HINT_KEY = "zenith_admin_session_hint";
const ADMIN_EMAIL_HINT_KEY = "zenith_admin_email_hint";

export function persistAdminSessionHint(email: string): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(ADMIN_SESSION_HINT_KEY, "authenticated");
    storage.setItem(ADMIN_EMAIL_HINT_KEY, email);
  } catch {
    // Ignore storage failures (privacy mode / denied storage).
  }
}

export function clearAdminSessionHint(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(ADMIN_SESSION_HINT_KEY);
    storage.removeItem(ADMIN_EMAIL_HINT_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function getAdminEmailHint(): string {
  const storage = safeLocalStorage();
  if (!storage) return "";
  try {
    return storage.getItem(ADMIN_EMAIL_HINT_KEY) ?? "";
  } catch {
    return "";
  }
}

function safeLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
