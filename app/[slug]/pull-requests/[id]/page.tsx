import { notFound } from "next/navigation";

import { PullRequests } from "@/components/features/pull-requests";
import DashboardLayout from "@/components/shared/layout";
import { isResourceId } from "@/lib/helpers/id.helper";

interface PullRequestDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ repoId?: string | string[] }>;
}

const PullRequestDetailPage = async ({
  params,
  searchParams,
}: PullRequestDetailPageProps) => {
  const { id } = await params;
  const { repoId } = await searchParams;
  // Both ids go into API paths; a crafted link stops here, before any request.
  if (!isResourceId(id) || typeof repoId !== "string" || !isResourceId(repoId))
    notFound();

  return (
    <DashboardLayout title="Pull Request Detail">
      <PullRequests.PullRequestDetail id={id} repoId={repoId} />
    </DashboardLayout>
  );
};

export default PullRequestDetailPage;
