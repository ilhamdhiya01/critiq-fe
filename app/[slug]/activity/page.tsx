import { Activity } from "@/components/features/activity";
import DashboardLayout from "@/components/shared/layout";

const ActivityPage = () => {
  return (
    <DashboardLayout title="Activity">
      <Activity.ActivityView />
    </DashboardLayout>
  );
};

export default ActivityPage;
