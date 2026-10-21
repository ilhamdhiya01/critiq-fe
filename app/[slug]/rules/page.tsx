import { Rules } from "@/components/features/rules";
import DashboardLayout from "@/components/shared/layout";

const RulesPage = () => {
  return (
    <DashboardLayout title="Rules & Profiles">
      <Rules.RulesView />
    </DashboardLayout>
  );
};

export default RulesPage;
