export type PullRequestProvider = "GITHUB" | "GITLAB";
export type PullRequestState = "OPEN" | "CLOSED" | "MERGED";
export type EffectivePolicy = "MANUAL_ONLY" | "ALLOW_AI" | "REQUIRE_BOTH";
export type PullRequestFilter = "all" | "open" | "merged" | "closed";

export interface PullRequest {
  id: string;
  repositoryId: string;
  repositoryPath: string;
  provider: PullRequestProvider;
  externalId: string;
  title: string;
  authorUsername: string | null;
  sourceBranch: string;
  targetBranch: string;
  state: PullRequestState;
  effectivePolicy: EffectivePolicy;
  createdAt: string;
  updatedAt: string;
}

// PullRequestDetail (headSha) sengaja belum dibuat — endpoint
// GET /orgs/:orgId/repos/:repoId/pulls/:id (API_PULL_DETAIL di routes.ts)
// sudah tersedia di BE tapi service/hook/type-nya ditunda ke task halaman
// detail PR terpisah.
