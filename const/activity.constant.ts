import type { SegmentedOption } from "@/components/ui/segmented-control";
import type {
  ActivityDecisionFilter,
  ActivityModeFilter,
  ActivityPage,
} from "@/lib/types/activity.types";

export const ACTIVITY_PAGE_SIZE = 20;

export const ACTIVITY_DECISION_TABS: {
  value: ActivityDecisionFilter;
  label: string;
  countKey: keyof ActivityPage["counts"];
}[] = [
  { value: "all", label: "All", countKey: "all" },
  { value: "approve", label: "Approved", countKey: "approve" },
  { value: "request_changes", label: "Changes", countKey: "request_changes" },
];

export const ACTIVITY_MODE_OPTIONS: SegmentedOption<ActivityModeFilter>[] = [
  { value: "all", label: "All modes" },
  { value: "manual", label: "Manual" },
  { value: "ai_assisted", label: "AI-Assisted" },
];
