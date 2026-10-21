export type SearchPullState = "open" | "closed" | "merged";

export interface SearchRepository {
  id: string;
  path: string;
  language: string | null;
  openCriticalCount: number;
}

export interface SearchPull {
  id: string;
  repoId: string;
  repoPath: string;
  number: string;
  title: string;
  state: SearchPullState;
  updatedAt: string;
}

export interface SearchRule {
  // "tier" = a category on the Rules page, "rule" = one static rule.
  kind: "tier" | "rule";
  id: string;
  label: string;
  // Owning tier (for a tier, its own id).
  tier: string;
}

export interface GlobalSearchResult {
  repositories: SearchRepository[];
  pulls: SearchPull[];
  rules: SearchRule[];
}

export type SearchGroup = "repositories" | "pulls" | "rules" | "pages";

// Right-hand side of a result row.
export type SearchEntryMeta =
  | { kind: "critical"; text: string }
  | { kind: "language"; text: string }
  | { kind: "pull"; repoPath: string; state: SearchPullState }
  | { kind: "text"; text: string };

// One row of the palette, flattened across groups for keyboard navigation.
export interface SearchEntry {
  key: string;
  group: SearchGroup;
  label: string;
  meta: SearchEntryMeta | null;
  href: string;
}
