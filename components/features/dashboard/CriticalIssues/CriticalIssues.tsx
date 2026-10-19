"use client";

import { useParams } from "next/navigation";
import React, { useCallback, useState } from "react";

import SectionCard from "@/components/shared/section-card";
import Modal from "@/components/ui/modal";
import { useDashboardCriticalIssues } from "@/lib/hooks/dashboard/useDashboardCriticalIssues";
import { useRepoProviders } from "@/lib/hooks/repositories/useRepoProviders";

import CriticalIssueList from "./CriticalIssueList";

const CARD_LIMIT = 5;
const ALL_LIMIT = 50;

interface CriticalIssuesProps {
  orgId?: string;
}

const CriticalIssues = React.memo(({ orgId }: CriticalIssuesProps) => {
  const { slug } = useParams<{ slug: string }>();
  const [isAllOpen, setIsAllOpen] = useState(false);
  const providers = useRepoProviders(orgId);
  const card = useDashboardCriticalIssues(orgId, CARD_LIMIT);
  // Only fetched once the modal is opened.
  const all = useDashboardCriticalIssues(orgId, ALL_LIMIT, isAllOpen);

  const closeAll = useCallback(() => setIsAllOpen(false), []);
  const hasIssues = (card.data?.length ?? 0) > 0;

  return (
    <SectionCard
      title="Active Critical Issues"
      meta={
        hasIssues && (
          <button
            type="button"
            onClick={() => setIsAllOpen(true)}
            className="cursor-pointer text-[12px] text-info-light hover:underline"
          >
            View all
          </button>
        )
      }
    >
      <CriticalIssueList
        issues={card.data}
        isLoading={card.isLoading}
        isError={card.isError}
        providers={providers}
        slug={slug}
      />

      <Modal
        isOpen={isAllOpen}
        title="Active critical issues"
        onClose={closeAll}
      >
        <div className="-mx-5 -my-4">
          <CriticalIssueList
            issues={all.data}
            isLoading={all.isLoading}
            isError={all.isError}
            providers={providers}
            slug={slug}
          />
        </div>
      </Modal>
    </SectionCard>
  );
});

CriticalIssues.displayName = "CriticalIssues";

export default CriticalIssues;
