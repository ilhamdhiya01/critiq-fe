import React from "react";

import CriticalIssues from "../CriticalIssues";
import MonitoredRepositories from "../MonitoredRepositories";
import RecentActivity from "../RecentActivity";
import ReviewStats from "../ReviewStats";
import SummaryCards from "../SummaryCards";

// Server-rendered layout; each widget loads (and fails) on its own.
// Each widget reads the org itself (useActiveOrgId).
const DashboardView = React.memo(() => (
  <div className="flex flex-col gap-4">
    <SummaryCards />
    <MonitoredRepositories />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
      <CriticalIssues />
      <ReviewStats />
    </div>
    <RecentActivity />
  </div>
));

DashboardView.displayName = "DashboardView";

export default DashboardView;
