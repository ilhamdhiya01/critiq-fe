import {
  CONNECT_REPO_ERROR_MESSAGE,
  WEBHOOK_FAILED_MESSAGE,
} from "@/const/repository.constant";
import type { RepoCandidate } from "@/lib/types/integration.types";
import type {
  ConnectProjectInput,
  ConnectRepositoryItem,
} from "@/lib/types/repository.types";

export interface RepoSelectionState {
  selectedRepos: Record<string, boolean>;
  selectedBranches: Record<string, Record<string, boolean>>;
}

export const EMPTY_REPO_SELECTION: RepoSelectionState = {
  selectedRepos: {},
  selectedBranches: {},
};

// Unchecking a repo forgets its branch picks, so re-checking starts from the
// default branch again.
export const toggleRepoSelection = (
  state: RepoSelectionState,
  id: string,
): RepoSelectionState => {
  const selectedRepos = {
    ...state.selectedRepos,
    [id]: !state.selectedRepos[id],
  };
  if (selectedRepos[id] || !(id in state.selectedBranches)) {
    return { ...state, selectedRepos };
  }
  const selectedBranches = { ...state.selectedBranches };
  delete selectedBranches[id];
  return { selectedRepos, selectedBranches };
};

export const toggleBranchSelection = (
  state: RepoSelectionState,
  repoId: string,
  branch: string,
): RepoSelectionState => ({
  ...state,
  selectedBranches: {
    ...state.selectedBranches,
    [repoId]: {
      ...state.selectedBranches[repoId],
      [branch]: !state.selectedBranches[repoId]?.[branch],
    },
  },
});

// Pre-selects the default branch the first time a repo's branches load.
export const markDefaultBranch = (
  state: RepoSelectionState,
  repoId: string,
  defaultBranch: string,
): RepoSelectionState =>
  state.selectedBranches[repoId]
    ? state
    : {
        ...state,
        selectedBranches: {
          ...state.selectedBranches,
          [repoId]: { [defaultBranch]: true },
        },
      };

export const deselectRepos = (
  state: RepoSelectionState,
  ids: string[],
): RepoSelectionState =>
  ids.reduce(
    (acc, id) => (acc.selectedRepos[id] ? toggleRepoSelection(acc, id) : acc),
    state,
  );

export const countSelectedRepos = (state: RepoSelectionState): number =>
  Object.values(state.selectedRepos).filter(Boolean).length;

export const toConnectProjects = (
  state: RepoSelectionState,
): ConnectProjectInput[] =>
  Object.entries(state.selectedRepos)
    .filter(([, isSelected]) => isSelected)
    .map(([id]) => ({
      id,
      monitoredBranches: Object.entries(state.selectedBranches[id] ?? {})
        .filter(([, picked]) => picked)
        .map(([branch]) => branch),
    }));

export interface ConnectResultSummary {
  okCount: number;
  failedCount: number;
  // Candidate ids (as strings) of repos that connected successfully.
  okCandidateIds: string[];
  // Keyed by candidate id (provider repo id as string).
  rowErrors: Record<string, string>;
  webhookWarnings: { path: string; message: string }[];
}

export const summarizeConnectResult = (
  items: ConnectRepositoryItem[],
  candidates: RepoCandidate[],
  providerLabel: string,
): ConnectResultSummary => {
  const okPaths = new Set<string>();
  const rowErrors: Record<string, string> = {};
  const webhookWarnings: ConnectResultSummary["webhookWarnings"] = [];

  items.forEach((item) => {
    if (item.status === "ok") {
      okPaths.add(item.path);
      if (item.webhook.status === "failed") {
        webhookWarnings.push({
          path: item.path,
          message: WEBHOOK_FAILED_MESSAGE,
        });
      }
      return;
    }
    rowErrors[String(item.providerRepoId)] = CONNECT_REPO_ERROR_MESSAGE[
      item.error
    ]
      .replace("{branch}", item.branch ?? "")
      .replace("{provider}", providerLabel);
  });

  return {
    okCount: okPaths.size,
    failedCount: Object.keys(rowErrors).length,
    okCandidateIds: candidates
      .filter((candidate) => okPaths.has(candidate.path))
      .map((candidate) => String(candidate.id)),
    rowErrors,
    webhookWarnings,
  };
};

// "acme/platform/critiq-core" → "critiq-core".
export const repoName = (path: string): string =>
  path.split("/").filter(Boolean).at(-1) ?? path;

const LANGUAGE_DOT_CLASS: Record<string, string> = {
  typescript: "bg-info",
  javascript: "bg-warning-light",
  go: "bg-info-light",
  python: "bg-info",
  java: "bg-warning",
  kotlin: "bg-primary-400",
  swift: "bg-warning",
  hcl: "bg-primary-400",
  ruby: "bg-danger-light",
  rust: "bg-warning",
  php: "bg-primary-300",
  "c#": "bg-success",
};

export const languageDotClass = (language: string): string =>
  LANGUAGE_DOT_CLASS[language.toLowerCase()] ?? "bg-neutral-500";
