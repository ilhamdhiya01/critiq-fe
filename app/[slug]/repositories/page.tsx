import { Repositories } from "@/components/features/repositories";
import DashboardLayout from "@/components/shared/layout";
import { getUserFromToken } from "@/lib/helpers";

const RepositoriesPage = async () => {
  const userData = await getUserFromToken();

  return (
    <DashboardLayout title="Repositories">
      <Repositories.RepositoryList orgId={userData?.activeOrgId ?? undefined} />
    </DashboardLayout>
  );
};

export default RepositoriesPage;
