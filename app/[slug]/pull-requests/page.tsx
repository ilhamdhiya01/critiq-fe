import { PullRequests } from "@/components/features/pull-requests";
import DashboardLayout from "@/components/shared/layout";

const PullRequestsPage = () => {
  return (
    <DashboardLayout title="Pull Requests">
      <PullRequests.PullRequestList />
    </DashboardLayout>
  );
};

export default PullRequestsPage;
