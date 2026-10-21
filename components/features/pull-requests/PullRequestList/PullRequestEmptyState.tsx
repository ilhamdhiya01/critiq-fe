import React from "react";

import EmptyState from "@/components/shared/empty-state";
import Button from "@/components/ui/button";
import { ROUTES } from "@/routes";

interface PullRequestEmptyStateProps {
  slug: string;
}

const PullRequestEmptyState = React.memo(
  ({ slug }: PullRequestEmptyStateProps) => (
    <EmptyState
      size="page"
      icon="TbGitPullRequest"
      title="No pull requests yet"
      description="Critiq is watching your connected repositories. New pull requests and merge requests show up here automatically and get reviewed against your rules."
      action={
        <>
          <Button
            link={ROUTES.rules(slug)}
            variant="primary"
            size="md"
            fullWidth={false}
          >
            Review rules
          </Button>
          <Button
            link={ROUTES.repositories(slug)}
            variant="secondary"
            size="md"
            fullWidth={false}
          >
            View repositories
          </Button>
        </>
      }
    />
  ),
);

PullRequestEmptyState.displayName = "PullRequestEmptyState";

export default PullRequestEmptyState;
