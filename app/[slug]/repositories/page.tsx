import { Repositories } from "@/components/features/repositories";
import DashboardLayout from "@/components/shared/layout";

const RepositoriesPage = () => {
  return (
    <DashboardLayout title="Repositories">
      <Repositories.RepositoryList />
    </DashboardLayout>
  );
};

export default RepositoriesPage;
