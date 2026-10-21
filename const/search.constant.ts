import type { SearchGroup } from "@/lib/types/search.types";

export const SEARCH_DEBOUNCE_MS = 500;
// The BE rejects longer queries (400).
export const SEARCH_MAX_LENGTH = 100;
// Results per group.
export const SEARCH_LIMIT = 5;
export const SEARCH_STALE_MS = 30_000;

export const SEARCH_GROUP_LABEL: Record<SearchGroup, string> = {
  repositories: "Repositories",
  pulls: "Pull requests",
  rules: "Rules",
  pages: "Pages",
};

export const SEARCH_GROUP_BADGE: Record<
  SearchGroup,
  { label: string; tone: "neutral" | "info" | "orange" | "primary" }
> = {
  repositories: { label: "REPO", tone: "neutral" },
  pulls: { label: "PR", tone: "info" },
  rules: { label: "RULE", tone: "orange" },
  pages: { label: "PAGE", tone: "primary" },
};
