import { Insights } from "@/components/features/insights";
import DashboardLayout from "@/components/shared/layout";
import { getUserFromToken } from "@/lib/helpers";

const InsightsPage = async () => {
  const userData = await getUserFromToken();

  return (
    <DashboardLayout title="Insights">
      <Insights.InsightsView orgId={userData?.activeOrgId ?? undefined} />
    </DashboardLayout>
  );
};

export default InsightsPage;
