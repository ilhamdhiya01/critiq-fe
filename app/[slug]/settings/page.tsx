import { Settings } from "@/components/features/settings";
import DashboardLayout from "@/components/shared/layout";
import { getUserFromToken } from "@/lib/helpers";

const SettingsPage = async () => {
  const userData = await getUserFromToken();

  return (
    <DashboardLayout title="Settings">
      <Settings.SettingsView orgId={userData?.activeOrgId ?? undefined} />
    </DashboardLayout>
  );
};

export default SettingsPage;
