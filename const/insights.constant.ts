import type { FindingSource } from "@/lib/types/pull-request.types";

export const INSIGHTS_SOURCE_LABEL: Record<FindingSource, string> = {
  STATIC: "Static",
  AI: "AI",
};

// SVG strokes/fills take CSS colours, so the chart reads the theme tokens.
export const INSIGHTS_SOURCE_COLOR: Record<FindingSource, string> = {
  STATIC: "var(--color-danger-light)",
  AI: "var(--color-primary-400)",
};

export const INSIGHTS_SOURCE_BAR: Record<FindingSource, string> = {
  STATIC: "bg-danger-light",
  AI: "bg-primary-400",
};

export const INSIGHTS_COMPARISON = "vs previous 30 days";

export const RESOLVED_TOOLTIP =
  "Critical issues that no longer appear in their pull request (fixed, or the code was removed)";

export const MTTR_TOOLTIP =
  "Time from first detection until the finding no longer appears in the PR";
