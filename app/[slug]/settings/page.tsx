import { Settings } from "@/components/features/settings";
import DashboardLayout from "@/components/shared/layout";

const SettingsPage = () => {
  return (
    <DashboardLayout title="Settings">
      <Settings.SettingsView />
    </DashboardLayout>
  );
};

export default SettingsPage;
