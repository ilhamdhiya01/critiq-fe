import { ACTIVE_REPO_SCAN_STATUSES } from "@/const/repository.constant";
import type { AiSummaryStatus } from "@/lib/types/pull-request.types";
import type { RepoScanStatus } from "@/lib/types/repository.types";

// The two halves of one scan, as both the scan history and a PR's latest
// scan report them.
export interface ScanStatusInput {
  status: RepoScanStatus;
  aiStatus?: AiSummaryStatus | null;
  aiErrorCode?: string | null;
}

export type ScanDisplayStatus =
  // Static scan not done yet, or it ended without results.
  | { kind: "static"; status: Exclude<RepoScanStatus, "DONE"> }
  // Static done; the AI review is still running (criticals may grow).
  | { kind: "ai_reviewing" }
  | { kind: "ai_failed"; errorCode: string | null }
  // `isStaticOnly`: the AI review was skipped/blocked or never ran.
  | { kind: "done"; isStaticOnly: boolean };

const AI_IN_PROGRESS = new Set<string>(["queued", "running"]);
const AI_COMPLETE = new Set<string>(["done", "cached"]);

// One status for a scan, combining static and AI, in priority order:
// static not done → AI running → AI failed → AI done → static only.
export const scanDisplayStatus = (scan: ScanStatusInput): ScanDisplayStatus => {
  // The BE's casing has varied; compare case-insensitively. A scan that
  // reports findings but no status (older payloads) is treated as finished
  // rather than crashing the page.
  const status = (scan.status ?? "DONE").toUpperCase() as RepoScanStatus;
  if (status !== "DONE") return { kind: "static", status };

  const aiStatus = scan.aiStatus?.toLowerCase() ?? null;
  if (aiStatus && AI_IN_PROGRESS.has(aiStatus)) return { kind: "ai_reviewing" };
  if (aiStatus === "failed") {
    return { kind: "ai_failed", errorCode: scan.aiErrorCode ?? null };
  }
  return {
    kind: "done",
    isStaticOnly: !aiStatus || !AI_COMPLETE.has(aiStatus),
  };
};

// Still changing: worth polling (when realtime is down) until it settles.
export const isScanInProgress = (scan: ScanStatusInput): boolean => {
  const display = scanDisplayStatus(scan);
  return (
    display.kind === "ai_reviewing" ||
    (display.kind === "static" && ACTIVE_REPO_SCAN_STATUSES.has(display.status))
  );
};
