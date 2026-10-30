// Every dynamic segment goes through seg(): an id taken from the URL (e.g.
// `?repoId=../../x`) must never be able to step out of its own path segment
// and point the request at another endpoint.
const seg = (value: string | number) => encodeURIComponent(String(value));

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
  // Always open to a signed-in user, whatever orgs they already have.
  NEW_ORGANIZATION: "/organizations/new",
  invite: (token: string) => `/invite/${seg(token)}`,

  dashboard: (slug: string) => `/${seg(slug)}`,
  pullRequests: (slug: string) => `/${seg(slug)}/pull-requests`,
  pullRequestDetail: (slug: string, id: string, repositoryId: string) =>
    `/${seg(slug)}/pull-requests/${seg(id)}?repoId=${seg(repositoryId)}`,
  repositories: (slug: string) => `/${seg(slug)}/repositories`,
  repositoryDetail: (slug: string, id: string) =>
    `/${seg(slug)}/repositories/${seg(id)}`,
  rules: (slug: string) => `/${seg(slug)}/rules`,
  activity: (slug: string) => `/${seg(slug)}/activity`,
  insights: (slug: string) => `/${seg(slug)}/insights`,
  settings: (slug: string) => `/${seg(slug)}/settings`,
} as const;

// API endpoints (consumed by services/*.service.ts)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Auth
export const API_AUTH = `${API_BASE_URL}/auth`;
export const API_AUTH_ME = `${API_AUTH}/me`;
// The session cookie is httpOnly — only the BE can clear it.
export const API_AUTH_LOGOUT = `${API_AUTH}/logout`;
export const API_OAUTH_LOGIN = (provider: "github" | "gitlab") =>
  `${API_AUTH}/${provider}`;

// Organizations
export const API_ORG = `${API_BASE_URL}/orgs`;
export const API_ME_ORG = `${API_BASE_URL}/me/orgs`;
// SSE stream of "data changed" hints for one org (see RealtimeProvider).
export const API_ORG_EVENTS = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/events`;

// Members & invites (org-scoped, Admin-only writes)
export const API_ORG_MEMBERS = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/members`;
export const API_ORG_MEMBER = (orgId: string, userId: string) =>
  `${API_ORG_MEMBERS(orgId)}/${seg(userId)}`;
export const API_ORG_INVITES = (orgId: string) =>
  `${API_ORG_MEMBERS(orgId)}/invites`;
export const API_ORG_INVITE = (orgId: string, id: string) =>
  `${API_ORG_INVITES(orgId)}/${seg(id)}`;
export const API_ORG_INVITE_RESEND = (orgId: string, id: string) =>
  `${API_ORG_INVITE(orgId, id)}/resend`;

// Invite acceptance (global; the preview is public)
export const API_INVITE = (token: string) =>
  `${API_BASE_URL}/invites/${seg(token)}`;
export const API_INVITE_ACCEPT = (token: string) =>
  `${API_INVITE(token)}/accept`;

// Activity (review decisions across the org, cursor paginated)
export const API_ORG_ACTIVITY = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/activity`;

// Global search (⌘K): repos, PRs and rules
export const API_ORG_SEARCH = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/search`;

// Insights (trends over the last weeks)
export const API_INSIGHTS = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/insights`;

// Dashboard
export const API_DASHBOARD_SUMMARY = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/dashboard/summary`;
export const API_DASHBOARD_CRITICAL_ISSUES = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/dashboard/critical-issues`;
export const API_DASHBOARD_RECENT_REVIEWS = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/dashboard/recent-reviews`;

// Repositories
export const API_CONNECT_REPOS = (ordId: string) =>
  `${API_ORG}/${seg(ordId)}/repos`;
export const API_ORG_REPO = (orgId: string, repoId: string) =>
  `${API_ORG}/${seg(orgId)}/repos/${seg(repoId)}`;
export const API_REPO_SCAN_CONFIG = (orgId: string, repoId: string) =>
  `${API_ORG_REPO(orgId, repoId)}/scan-config`;
export const API_ORG_REPO_PULLS = (orgId: string, repoId: string) =>
  `${API_ORG_REPO(orgId, repoId)}/pulls`;
export const API_ORG_REPO_SCANS = (orgId: string, repoId: string) =>
  `${API_ORG_REPO(orgId, repoId)}/scans`;
export const API_ORG_REPO_BRANCHES = (orgId: string, repoId: string) =>
  `${API_ORG_REPO(orgId, repoId)}/branches`;

// Integrations (GitHub/GitLab)
export const API_INTEGRATIONS = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/integrations`;
export const API_INTEGRATIONS_GITLAB = (orgId: string) =>
  `${API_INTEGRATIONS(orgId)}/gitlab`;
export const API_INTEGRATIONS_GITLAB_HEALTH = (orgId: string) =>
  `${API_INTEGRATIONS_GITLAB(orgId)}/health`;
export const API_INTEGRATIONS_GITHUB_ROOT = (orgId: string) =>
  `${API_INTEGRATIONS(orgId)}/github`;
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
) =>
  `${API_INTEGRATIONS(orgId)}/${source}/repos/${seg(providerRepoId)}/branches`;

// Pull requests (org-wide, read-only, populated by webhook — no polling from BE)
export const API_PULLS = (orgId: string) => `${API_ORG}/${seg(orgId)}/pulls`;
export const API_PULL_DETAIL = (orgId: string, repoId: string, id: string) =>
  `${API_ORG}/${seg(orgId)}/repos/${seg(repoId)}/pulls/${seg(id)}`;
export const API_PULL_DETAIL_DIFF = (
  orgId: string,
  repoId: string,
  id: string,
) => `${API_PULL_DETAIL(orgId, repoId, id)}/diff`;
export const API_PULL_DETAIL_SUMMARY = (
  orgId: string,
  repoId: string,
  id: string,
) => `${API_PULL_DETAIL(orgId, repoId, id)}/summary`;
export const API_PULL_SCANS = (orgId: string, repoId: string, id: string) =>
  `${API_PULL_DETAIL(orgId, repoId, id)}/scans`;
export const API_PULL_REVIEW = (orgId: string, repoId: string, id: string) =>
  `${API_PULL_DETAIL(orgId, repoId, id)}/review`;
export const API_PULL_REVIEWS = (orgId: string, repoId: string, id: string) =>
  `${API_PULL_DETAIL(orgId, repoId, id)}/reviews`;
export const API_PULL_REVIEW_SYNC = (
  orgId: string,
  repoId: string,
  id: string,
  reviewId: string,
) => `${API_PULL_REVIEWS(orgId, repoId, id)}/${seg(reviewId)}/sync`;
export const API_PULL_COMMENTS = (orgId: string, repoId: string, id: string) =>
  `${API_PULL_DETAIL(orgId, repoId, id)}/comments`;
export const API_PULL_COMMENT_SYNC = (
  orgId: string,
  repoId: string,
  id: string,
  commentId: string,
) => `${API_PULL_COMMENTS(orgId, repoId, id)}/${seg(commentId)}/sync`;
export const API_PULL_MERGE = (orgId: string, repoId: string, id: string) =>
  `${API_PULL_DETAIL(orgId, repoId, id)}/merge`;
export const API_PULL_SUMMARY_REGENERATE = (
  orgId: string,
  repoId: string,
  id: string,
) =>
  `${API_ORG}/${seg(orgId)}/repos/${seg(repoId)}/pulls/${seg(id)}/summary/regenerate`;

export const API_PULL_RESCAN = (orgId: string, repoId: string) =>
  `${API_ORG}/${seg(orgId)}/repos/${seg(repoId)}/rescan`;

// Rules (quality profile)
export const API_ORG_RULES = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/rules`;

// External
export const GITHUB_INSTALLATIONS_URL =
  "https://github.com/settings/installations";
export const GOOGLE_AI_STUDIO_API_KEY_URL =
  "https://aistudio.google.com/apikey";

// Settings
export const API_SETTINGS_AI = (orgId: string) =>
  `${API_ORG}/${seg(orgId)}/settings/ai`;
export const API_SETTINGS_AI_TEST = (orgId: string) =>
  `${API_SETTINGS_AI(orgId)}/test`;
export const API_SETTINGS_AI_MODELS = (orgId: string) =>
  `${API_SETTINGS_AI(orgId)}/models`;

export const authRoutes = [ROUTES.LOGIN, ROUTES.REGISTER] as const;

// Consumed by proxy.ts. Org screens live under a dynamic `/<slug>` segment,
// so they cannot be enumerated — the guard is inverted instead: everything
// is private unless it appears here. A new public page must be added to this
// list, which fails safe (a forgotten page is guarded, not exposed).
export const publicRoutes = [...authRoutes] as const;

// Dynamic public pages, matched like authRoutes (`[param]` = one segment).
// The invite page must open without a session (and without an org).
export const publicRoutePatterns = ["/invite/[token]"] as const;

const toRoutePattern = (route: string) =>
  new RegExp(`^${route.replace(/\[.*?\]/g, "[^/]+")}$`);

export const isPublicPath = (path: string): boolean =>
  publicRoutes.some((route) => route === path) ||
  publicRoutePatterns.some((route) => toRoutePattern(route).test(path));
