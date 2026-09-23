import { PullRequests } from "@/components/features/pull-requests";
import DashboardLayout from "@/components/shared/layout";
import { getUserFromToken } from "@/lib/helpers";

const PullRequestsPage = async () => {
  const userData = await getUserFromToken();

  return (
    <DashboardLayout title="Pull Requests">
      <PullRequests.PullRequestList
        orgId={userData?.activeOrgId ?? undefined}
      />
    </DashboardLayout>
  );
};

export default PullRequestsPage;
