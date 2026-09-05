// Application paths (client-side navigation)
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  REPOSITORIES: "/repositories",
} as const;

// API endpoints (consumed by services/*.service.ts)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const API_AUTH_LOGIN = "/auth/login";
export const API_AUTH_REGISTER = "/auth/register";
export const API_AUTH_ME = "/auth/me";

export const API_REPOS = "/repos";
export const API_REPO_DETAIL = (id: string) => `/repos/${id}`;
export const API_REPO_SCANS = (id: string) => `/repos/${id}/scans`;
export const API_REPO_RESCAN = (id: string) => `/repos/${id}/rescan`;

// Routes requiring an authenticated session — consumed by proxy.ts
export const privateRoutes = [ROUTES.DASHBOARD] as const;
