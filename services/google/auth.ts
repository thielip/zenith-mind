import { GoogleAuth } from "google-auth-library";

export function getServiceAccountCredentials() {
  const clientEmail = process.env["GA4_CLIENT_EMAIL"]?.trim();
  const privateKeyRaw = process.env["GA4_PRIVATE_KEY"]?.trim();
  if (!clientEmail || !privateKeyRaw) {
    return null;
  }
  return {
    client_email: clientEmail,
    private_key: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

export function createGoogleAuth(scopes: string[]) {
  const credentials = getServiceAccountCredentials();
  if (!credentials) return null;
  return new GoogleAuth({ credentials, scopes });
}
