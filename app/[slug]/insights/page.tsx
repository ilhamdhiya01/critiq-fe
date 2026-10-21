import { Insights } from "@/components/features/insights";
import DashboardLayout from "@/components/shared/layout";

const InsightsPage = () => {
  return (
    <DashboardLayout title="Insights">
      <Insights.InsightsView />
    </DashboardLayout>
  );
};

export default InsightsPage;
