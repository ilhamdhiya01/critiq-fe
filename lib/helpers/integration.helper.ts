import {
  GITLAB_ERROR_MESSAGE,
  INTEGRATION_FORBIDDEN_MESSAGE,
} from "@/const/integration.constant";
import { getDaysUntil } from "@/lib/helpers/date.helper";
import type { ApiFieldError } from "@/lib/types/api.types";
import type {
  Integration,
  IntegrationsBySource,
} from "@/lib/types/integration.types";
import type {
  OrgRepository,
  RepoCountByProvider,
} from "@/lib/types/repository.types";

export type GitLabFormField = "token" | "instance_url";

export type GitLabFieldErrors = Partial<Record<GitLabFormField, string>>;

export type StatusTone = "green" | "orange" | "red";

export interface IntegrationStatusView {
  label: string;
  tone: StatusTone;
  message: string | null;
}

const GITLAB_FORM_FIELDS: GitLabFormField[] = ["token", "instance_url"];

// Repos connected in Critiq — not the repos the GitHub App may access.
export const formatConnectedRepoCount = (count: number): string =>
  `${count} ${count === 1 ? "repo" : "repos"} connected`;

export const formatDayCount = (days: number): string =>
  `${days} ${days === 1 ? "day" : "days"}`;

export const getIntegrationStatus = (
  integration: Integration,
  now = Date.now(),
): IntegrationStatusView => {
  switch (integration.state) {
    case "ACTIVE":
      return { label: "Connected", tone: "green", message: null };
    case "PENDING_APPROVAL":
      return { label: "Pending approval", tone: "orange", message: null };
    case "EXPIRING_SOON":
      return {
        label: "Expiring soon",
        tone: "orange",
        message: integration.expiresAt
          ? `Token expires in ${formatDayCount(Math.max(0, getDaysUntil(integration.expiresAt, now)))}`
          : "Token expires soon",
      };
    case "TOKEN_EXPIRED":
      return {
        label: "Token expired",
        tone: "red",
        message: "Token expired — scans paused",
      };
    case "INVALID":
      return integration.source === "GITHUB"
        ? { label: "Error", tone: "red", message: null }
        : {
            label: "Invalid",
            tone: "red",
            message: "Token rejected by GitLab",
          };
  }
};

export const splitIntegrations = (
  integrations: Integration[],
): IntegrationsBySource => ({
  github: integrations.find((item) => item.source === "GITHUB") ?? null,
  gitlab: integrations.find((item) => item.source === "GITLAB") ?? null,
});

export const countReposByProvider = (
  repos: OrgRepository[],
): RepoCountByProvider =>
  repos.reduce<RepoCountByProvider>(
    (acc, repo) => {
      acc[repo.provider] += 1;
      return acc;
    },
    { GITHUB: 0, GITLAB: 0 },
  );

export const toGitLabFieldErrors = (
  errors: ApiFieldError[],
): GitLabFieldErrors =>
  errors.reduce<GitLabFieldErrors>((acc, error) => {
    const field = error.field as GitLabFormField;
    if (!GITLAB_FORM_FIELDS.includes(field)) return acc;
    acc[field] = GITLAB_ERROR_MESSAGE[error.message] ?? error.message;
    return acc;
  }, {});

// Errors without a form field (403, 502, provider_bad_request, …).
export const getIntegrationErrorMessage = (
  status: number | undefined,
  code: string,
): string =>
  status === 403
    ? INTEGRATION_FORBIDDEN_MESSAGE
    : (GITLAB_ERROR_MESSAGE[code] ?? code);

export const upsertIntegration = (
  integrations: Integration[],
  next: Integration,
): Integration[] => [
  ...integrations.filter((item) => item.source !== next.source),
  next,
];

export const hostOf = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};
