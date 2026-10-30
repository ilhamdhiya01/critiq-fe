// `/login?error=<code>` from the BE's OAuth callback.
export const LOGIN_ERROR_MESSAGE: Record<string, string> = {
  // The OAuth `state` cookie was missing or expired.
  oauth_state: "Sesi login kedaluwarsa, coba lagi",
};
