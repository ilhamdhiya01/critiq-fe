import React from "react";

import CriticalIssues from "../CriticalIssues";
import MonitoredRepositories from "../MonitoredRepositories";
import RecentActivity from "../RecentActivity";
import ReviewStats from "../ReviewStats";
import SummaryCards from "../SummaryCards";

interface DashboardViewProps {
  orgId?: string;
}

// Server-rendered layout; each widget loads (and fails) on its own.
const DashboardView = React.memo(({ orgId }: DashboardViewProps) => (
  <div className="flex flex-col gap-4">
    <SummaryCards orgId={orgId} />
    <MonitoredRepositories orgId={orgId} />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      <CriticalIssues orgId={orgId} />
      <ReviewStats orgId={orgId} />
    </div>
    <RecentActivity orgId={orgId} />
  </div>
));

DashboardView.displayName = "DashboardView";

export default DashboardView;
