// Copy for API errors that are not tied to one feature.

// 429 from the rate-limited writes (create org, connect GitLab, accept
// invite).
export const TOO_MANY_ATTEMPTS_MESSAGE =
  "Terlalu banyak percobaan, coba lagi nanti";

// Shown instead of the raw code the axios interceptor would surface.
export const API_ERROR_MESSAGE: Record<string, string> = {
  // 403 from the BE's CSRF check: the request did not come from Critiq's
  // own origin.
  origin_not_allowed:
    "Permintaan ditolak. Buka Critiq dari alamat resminya lalu coba lagi.",
};
