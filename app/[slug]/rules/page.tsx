import { Rules } from "@/components/features/rules";
import DashboardLayout from "@/components/shared/layout";
import { getUserFromToken } from "@/lib/helpers";

const RulesPage = async () => {
  const userData = await getUserFromToken();

  return (
    <DashboardLayout title="Rules & Profiles">
      <Rules.RulesView orgId={userData?.activeOrgId ?? undefined} />
    </DashboardLayout>
  );
};

export default RulesPage;
