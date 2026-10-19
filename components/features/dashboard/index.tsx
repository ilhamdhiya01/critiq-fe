import { default as CriticalIssues } from "./CriticalIssues";
import { default as DashboardView } from "./DashboardView";
import { default as MonitoredRepositories } from "./MonitoredRepositories";
import { default as RecentActivity } from "./RecentActivity";
import { default as ReviewStats } from "./ReviewStats";
import { default as SummaryCards } from "./SummaryCards";

export const Dashboard = {
  CriticalIssues,
  DashboardView,
  MonitoredRepositories,
  RecentActivity,
  ReviewStats,
  SummaryCards,
} as const;
