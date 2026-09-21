export type PullRequestSource = "github" | "gitlab";
export type PullRequestReviewMode = "manual" | "ai_assisted";
export type PullRequestStatus = "open" | "approved" | "changes_requested";
export type PullRequestFilter = "all" | "open" | "approved" | "needs_attention";

export interface PullRequest {
  id: string;
  title: string;
  number: string;
  source: PullRequestSource;
  repository: string;
  targetBranch: string;
  author: string;
  criticalCount: number;
  reviewMode: PullRequestReviewMode;
  status: PullRequestStatus;
  updatedAt: string;
}
