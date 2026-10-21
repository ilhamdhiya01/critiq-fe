import React from "react";

import CriticalTrendChart from "../CriticalTrendChart";
import InsightsSummaryCards from "../InsightsSummaryCards";
import TopRules from "../TopRules";

// Server-rendered layout; the blocks read the org themselves and share one
// cached insights query.
const InsightsView = React.memo(() => (
  <div className="flex flex-col gap-4">
    <InsightsSummaryCards />
    <CriticalTrendChart />
    <TopRules />
  </div>
));

InsightsView.displayName = "InsightsView";

export default InsightsView;
