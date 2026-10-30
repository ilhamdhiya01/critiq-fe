import { notFound } from "next/navigation";

import { Repositories } from "@/components/features/repositories";
import DashboardLayout from "@/components/shared/layout";
import { isResourceId } from "@/lib/helpers/id.helper";

interface RepositoryDetailPageProps {
  params: Promise<{ id: string }>;
}

const RepositoryDetailPage = async ({ params }: RepositoryDetailPageProps) => {
  const { id } = await params;
  if (!isResourceId(id)) notFound();

  return (
    <DashboardLayout title="Repository">
      <Repositories.RepositoryDetail repoId={id} />
    </DashboardLayout>
  );
};

export default RepositoryDetailPage;
