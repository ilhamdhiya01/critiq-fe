import { PULL_REQUEST_NUMBER_PREFIX } from "@/const/pull-request.constant";
import { repoName } from "@/lib/helpers/repository.helper";
import type { IntegrationProvider } from "@/lib/types/integration.types";

// "38 min" under an hour, otherwise "4.6 h"; "—" when there is no data.
export const formatDurationHours = (hours: number | null): string => {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${(Math.round(hours * 10) / 10).toFixed(1)} h`;
};

export interface TurnaroundTrend {
  direction: "down" | "up" | "same";
  // Faster reviews are good.
  tone: "good" | "bad" | "neutral";
  // Size of the change, e.g. "38 min".
  text: string;
}

export const getTurnaroundTrend = (
  avgHours: number | null,
  previousAvgHours: number | null,
): TurnaroundTrend | null => {
  if (avgHours === null || previousAvgHours === null) return null;

  const diff = avgHours - previousAvgHours;
  const text = formatDurationHours(Math.abs(diff));
  // Under a minute either way reads as no change.
  if (Math.abs(diff) * 60 < 1) {
    return { direction: "same", tone: "neutral", text };
  }
  return diff < 0
    ? { direction: "down", tone: "good", text }
    : { direction: "up", tone: "bad", text };
};

// Rounded so the two shares always add up to 100. null = nothing to split.
export const getReviewSplit = (
  total: number,
  aiAssisted: number,
): { aiPercent: number; manualPercent: number } | null => {
  if (total <= 0) return null;
  const aiPercent = Math.round((aiAssisted / total) * 100);
  return { aiPercent, manualPercent: 100 - aiPercent };
};

// "#482 · payments-api" (GitLab: "!482"). Unknown provider falls back to "#".
export const formatPullRef = (
  provider: IntegrationProvider | undefined,
  number: string,
  repoPath: string,
): string =>
  `${PULL_REQUEST_NUMBER_PREFIX[provider ?? "GITHUB"]}${number} · ${repoName(repoPath)}`;
