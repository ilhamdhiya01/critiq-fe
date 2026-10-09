import React from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import { ROUTES } from "@/routes";

interface PullRequestEmptyStateProps {
  slug: string;
}

const PullRequestEmptyState = React.memo(
  ({ slug }: PullRequestEmptyStateProps) => {
    return (
      <div className="flex flex-col items-center rounded-lg border border-border-subtle bg-surface px-6 py-24 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-border-default bg-raised">
          <Icon
            icon="TbGitPullRequest"
            size={18}
            className="text-text-secondary"
          />
        </span>
        <h2 className="mt-5 font-mono text-[15px] font-semibold text-text-strong">
          No pull requests yet
        </h2>
        <p className="mt-3 max-w-110 text-[13px] leading-relaxed text-text-secondary">
          Critiq is watching your connected repositories. New pull requests and
          merge requests show up here automatically and get reviewed against
          your rules.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
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
        </div>
      </div>
    );
  },
);

PullRequestEmptyState.displayName = "PullRequestEmptyState";

export default PullRequestEmptyState;
