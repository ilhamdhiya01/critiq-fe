import React from "react";

import CriticalTrendChart from "../CriticalTrendChart";
import InsightsSummaryCards from "../InsightsSummaryCards";
import TopRules from "../TopRules";

interface InsightsViewProps {
  orgId?: string;
}

// Server-rendered layout; the blocks share one cached insights query.
const InsightsView = React.memo(({ orgId }: InsightsViewProps) => (
  <div className="flex flex-col gap-4">
    <InsightsSummaryCards orgId={orgId} />
    <CriticalTrendChart orgId={orgId} />
    <TopRules orgId={orgId} />
  </div>
));

InsightsView.displayName = "InsightsView";

export default InsightsView;
