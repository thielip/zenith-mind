const ADMIN_SESSION_HINT_KEY = "zenith_admin_session_hint";
const ADMIN_EMAIL_HINT_KEY = "zenith_admin_email_hint";

export function persistAdminSessionHint(email: string): void {
  localStorage.setItem(ADMIN_SESSION_HINT_KEY, "authenticated");
  localStorage.setItem(ADMIN_EMAIL_HINT_KEY, email);
}

export function clearAdminSessionHint(): void {
  localStorage.removeItem(ADMIN_SESSION_HINT_KEY);
  localStorage.removeItem(ADMIN_EMAIL_HINT_KEY);
}

export function getAdminEmailHint(): string {
  return localStorage.getItem(ADMIN_EMAIL_HINT_KEY) ?? "";
}
