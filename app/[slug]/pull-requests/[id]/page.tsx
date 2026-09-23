import { PullRequests } from "@/components/features/pull-requests";
import DashboardLayout from "@/components/shared/layout";
import { getUserFromToken } from "@/lib/helpers";

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
  const userData = await getUserFromToken();

  return (
    <DashboardLayout title="Pull Request Detail">
      <PullRequests.PullRequestDetail
        id={id}
        repoId={repoId ?? ""}
        orgId={userData?.activeOrgId ?? undefined}
      />
    </DashboardLayout>
  );
};

export default PullRequestDetailPage;
