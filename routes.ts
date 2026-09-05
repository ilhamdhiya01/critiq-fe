// Application paths (client-side navigation)
export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  REPOSITORIES: "/repositories",
} as const;

// API endpoints (consumed by services/*.service.ts)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const API_AUTH = `${API_BASE_URL}/auth`;
export const API_OAUTH_LOGIN = (provider: "github" | "gitlab") =>
  `${API_AUTH}/${provider}`;
export const API_AUTH_ME = `${API_AUTH}/me`;

export const API_REPOS = `${API_BASE_URL}/repos`;
export const API_REPO_DETAIL = (id: string) => `${API_BASE_URL}/repos/${id}`;
export const API_REPO_SCANS = (id: string) =>
  `${API_BASE_URL}/repos/${id}/scans`;
export const API_REPO_RESCAN = (id: string) =>
  `${API_BASE_URL}/repos/${id}/rescan`;

// Routes requiring an authenticated session — consumed by proxy.ts
// ROOT ("/") is matched separately as an exact path, since every path
// starts with "/" and would otherwise match a prefix check.
export const privateRoutes = [ROUTES.DASHBOARD, ROUTES.REPOSITORIES] as const;
export const authRoutes = [ROUTES.LOGIN, ROUTES.REGISTER] as const;
