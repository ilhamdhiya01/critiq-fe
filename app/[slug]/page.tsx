import { Dashboard } from "@/components/features/dashboard";
import DashboardLayout from "@/components/shared/layout";

const DashboardPage = () => {
  return (
    <DashboardLayout title="Dashboard">
      <Dashboard.DashboardView />
    </DashboardLayout>
  );
};

export default DashboardPage;
