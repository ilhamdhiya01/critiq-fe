import { Dashboard } from "@/components/features/dashboard";
import DashboardLayout from "@/components/shared/layout";
import { getUserFromToken } from "@/lib/helpers";

const DashboardPage = async () => {
  const userData = await getUserFromToken();

  return (
    <DashboardLayout title="Dashboard">
      <Dashboard.DashboardView orgId={userData?.activeOrgId ?? undefined} />
    </DashboardLayout>
  );
};

export default DashboardPage;
