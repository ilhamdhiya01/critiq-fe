import { PullRequests } from "@/components/features/pull-requests";
import DashboardLayout from "@/components/shared/layout";

interface PullRequestDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ repoId?: string }>;
}

const PullRequestDetailPage = async ({
  params,
  searchParams,
}: PullRequestDetailPageProps) => {
  const { id } = await params;
  const { repoId } = await searchParams;
  return (
    <DashboardLayout title="Pull Request Detail">
      <PullRequests.PullRequestDetail id={id} repoId={repoId ?? ""} />
    </DashboardLayout>
  );
};

export default PullRequestDetailPage;
