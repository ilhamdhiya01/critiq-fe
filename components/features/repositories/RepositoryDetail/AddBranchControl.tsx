"use client";

import React, { useMemo } from "react";

import FieldError from "@/components/ui/field-error";
import Skeleton from "@/components/ui/skeleton";
import {
  BRANCH_LIST_TRUNCATED_HINT,
  PROVIDER_ACCESS_ERROR_MESSAGE,
  PROVIDER_NAME,
} from "@/const/repository.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { useRepoBranches } from "@/lib/hooks/repositories/useRepoBranches";
import type { IntegrationProvider } from "@/lib/types/integration.types";

const SKELETON_CHIPS = 4;

interface AddBranchControlProps {
  orgId: string;
  repoId: string;
  provider: IntegrationProvider;
  // Branches already in the table — hidden from the chips.
  monitored: string[];
  onAdd: (branch: string) => void;
}

// "From repo" chips of the provider's existing branches. There is deliberately
// no free-text add: Critiq never creates branches, so only real names go in.
const AddBranchControl = React.memo(
  ({ orgId, repoId, provider, monitored, onAdd }: AddBranchControlProps) => {
    const {
      data: repoBranches,
      isLoading,
      isError,
      error,
      refetch,
    } = useRepoBranches(orgId, repoId, "", true);

    const available = useMemo(
      () =>
        (repoBranches?.branches ?? []).filter(
          (branch) => !monitored.includes(branch),
        ),
      [repoBranches?.branches, monitored],
    );

    const renderChips = () => {
      if (isError) {
        const accessMessage =
          PROVIDER_ACCESS_ERROR_MESSAGE[getErrorCode(error) ?? ""];
        return (
          <FieldError className="flex-wrap">
            {accessMessage ??
              `Couldn't load branches from ${PROVIDER_NAME[provider]}.`}
            {!accessMessage && (
              <button
                type="button"
                onClick={() => refetch()}
                className="cursor-pointer text-text-nav underline underline-offset-2 transition-colors hover:text-text-strong"
              >
                Try again
              </button>
            )}
          </FieldError>
        );
      }

      if (isLoading) {
        return Array.from({ length: SKELETON_CHIPS }, (_, index) => (
          <Skeleton key={index} className="h-6.5 w-24 rounded-full" />
        ));
      }

      if (available.length === 0) {
        return (
          <span className="text-[11.5px] text-text-muted">
            Every branch in this repository is already monitored.
          </span>
        );
      }

      return available.map((branch) => (
        <button
          key={branch}
          type="button"
          onClick={() => onAdd(branch)}
          aria-label={`Monitor ${branch}`}
          className="cursor-pointer rounded-full border border-border-default bg-raised px-3 py-1 font-mono text-[11.5px] text-text-nav transition-colors hover:border-neutral-600 hover:text-text-strong"
        >
          + {branch}
        </button>
      ));
    };

    return (
      <div className="flex flex-col gap-2 border-b border-border-row px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] text-text-muted">From repo:</span>
          {renderChips()}
        </div>
        {!isError && repoBranches?.truncated && (
          <span className="text-[11px] text-text-faint">
            {BRANCH_LIST_TRUNCATED_HINT}
          </span>
        )}
      </div>
    );
  },
);

AddBranchControl.displayName = "AddBranchControl";

export default AddBranchControl;
