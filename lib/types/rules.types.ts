export type RuleTierId =
  | "secrets"
  | "crash"
  | "breaking_change"
  | "error_handling"
  | "performance"
  | "security"
  | "ci";

// How a tier is checked: static rules only, AI review only, both, or the CI
// status the code host reports.
export type RuleTierEngine = "static" | "ai" | "static+ai" | "ci";

export interface RuleTier {
  id: RuleTierId;
  enabled: boolean;
  engine: RuleTierEngine;
  // Only the AI review checks this tier: with no AI review on a PR (Manual
  // only, no provider, diff too large) it is not checked at all.
  requiresAi: boolean;
  staticRules: string[];
  aiCategories: string[];
}

export interface OrgRules {
  tiers: RuleTier[];
  enabledCount: number;
  totalCount: number;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface UpdateRuleTierInput {
  tier: RuleTierId;
  enabled: boolean;
}
