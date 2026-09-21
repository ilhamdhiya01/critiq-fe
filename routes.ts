// Application paths (client-side navigation).
//
// Every screen inside an organization is scoped by its slug (`/<slug>/...`),
// so the URL always names which organization is being viewed. Slug-scoped
// paths are builders; the handful of org-independent screens stay constants.
export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  SETUP: "/setup",

  dashboard: (slug: string) => `/${slug}`,
  pullRequests: (slug: string) => `/${slug}/pull-requests`,
  repositories: (slug: string) => `/${slug}/repositories`,
  rules: (slug: string) => `/${slug}/rules`,
  activity: (slug: string) => `/${slug}/activity`,
  insights: (slug: string) => `/${slug}/insights`,
  settings: (slug: string) => `/${slug}/settings`,
} as const;

// API endpoints (consumed by services/*.service.ts)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Auth
export const API_AUTH = `${API_BASE_URL}/auth`;
export const API_AUTH_ME = `${API_AUTH}/me`;
export const API_OAUTH_LOGIN = (provider: "github" | "gitlab") =>
  `${API_AUTH}/${provider}`;

// Organizations
export const API_ORG = `${API_BASE_URL}/orgs`;
export const API_ME_ORG = `${API_BASE_URL}/me/orgs`;

// Repositories
export const API_REPOS = `${API_ORG}/repos`;
export const API_CONNECT_REPOS = (ordId: string) => `${API_ORG}/${ordId}/repos`;
export const API_REPO_DETAIL = (id: string) => `${API_BASE_URL}/repos/${id}`;
export const API_REPO_SCANS = (id: string) =>
  `${API_BASE_URL}/repos/${id}/scans`;
export const API_REPO_RESCAN = (id: string) =>
  `${API_BASE_URL}/repos/${id}/rescan`;

// Integrations (GitHub/GitLab)
export const API_INTEGRATIONS = (orgId: string) =>
  `${API_ORG}/${orgId}/integrations`;
export const API_INTEGRATIONS_GITLAB = (orgId: string) =>
  `${API_INTEGRATIONS(orgId)}/gitlab`;
export const API_INTEGRATIONS_GITHUB = (orgId: string) =>
  `${API_INTEGRATIONS(orgId)}/github/install-intent`;
export const API_INTEGRATION_CANDIDATES = (
  orgId: string,
  source: "github" | "gitlab",
) => `${API_INTEGRATIONS(orgId)}/${source}/candidates`;
export const API_INTEGRATION_REPO_BRANCHES = (
  orgId: string,
  source: "github" | "gitlab",
  providerRepoId: string | number,
) => `${API_INTEGRATIONS(orgId)}/${source}/repos/${providerRepoId}/branches`;

// Pull requests (org-wide, read-only, populated by webhook — no polling from BE)
export const API_PULLS = (orgId: string) => `${API_ORG}/${orgId}/pulls`;
export const API_PULL_DETAIL = (orgId: string, repoId: string, id: string) =>
  `${API_ORG}/${orgId}/repos/${repoId}/pulls/${id}`;

export const authRoutes = [ROUTES.LOGIN, ROUTES.REGISTER] as const;

// Consumed by proxy.ts. Org screens live under a dynamic `/<slug>` segment,
// so they cannot be enumerated — the guard is inverted instead: everything
// is private unless it appears here. A new public page must be added to this
// list, which fails safe (a forgotten page is guarded, not exposed).
export const publicRoutes = [...authRoutes] as const;
