import { Repositories } from "@/components/features/repositories";
import DashboardLayout from "@/components/shared/layout";
import { getUserFromToken } from "@/lib/helpers";

interface RepositoryDetailPageProps {
  params: Promise<{ id: string }>;
}

const RepositoryDetailPage = async ({ params }: RepositoryDetailPageProps) => {
  const { id } = await params;
  const userData = await getUserFromToken();

  return (
    <DashboardLayout title="Repository">
      <Repositories.RepositoryDetail
        repoId={id}
        orgId={userData?.activeOrgId ?? undefined}
      />
    </DashboardLayout>
  );
};

export default RepositoryDetailPage;
