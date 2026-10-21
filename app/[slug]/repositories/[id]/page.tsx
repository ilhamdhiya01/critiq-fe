import { Repositories } from "@/components/features/repositories";
import DashboardLayout from "@/components/shared/layout";

interface RepositoryDetailPageProps {
  params: Promise<{ id: string }>;
}

const RepositoryDetailPage = async ({ params }: RepositoryDetailPageProps) => {
  const { id } = await params;
  return (
    <DashboardLayout title="Repository">
      <Repositories.RepositoryDetail repoId={id} />
    </DashboardLayout>
  );
};

export default RepositoryDetailPage;
