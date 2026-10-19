import { Activity } from "@/components/features/activity";
import DashboardLayout from "@/components/shared/layout";
import { getUserFromToken } from "@/lib/helpers";

const ActivityPage = async () => {
  const userData = await getUserFromToken();

  return (
    <DashboardLayout title="Activity">
      <Activity.ActivityView orgId={userData?.activeOrgId ?? undefined} />
    </DashboardLayout>
  );
};

export default ActivityPage;
