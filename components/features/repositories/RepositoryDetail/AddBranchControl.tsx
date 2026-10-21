"use client";

import React, { useMemo, useState } from "react";

import FieldError from "@/components/ui/field-error";
import Icon from "@/components/ui/icon/Icon";
import Skeleton from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";
import {
  BRANCH_CHIPS_COLLAPSED_LIMIT,
  BRANCH_LIST_TRUNCATED_HINT,
  BRANCH_SEARCH_DEBOUNCE_MS,
  PROVIDER_ACCESS_ERROR_MESSAGE,
  PROVIDER_NAME,
} from "@/const/repository.constant";
import { getErrorCode } from "@/lib/helpers/integration.helper";
import { useRepoBranches } from "@/lib/hooks/repositories/useRepoBranches";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { IntegrationProvider } from "@/lib/types/integration.types";

const SKELETON_CHIPS = 4;

const CHIP_CLASS =
  "cursor-pointer rounded-full border border-border-default bg-raised px-3 py-1 font-mono text-[11.5px] text-text-nav transition-colors hover:border-neutral-600 hover:text-text-strong";

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
// The search box only filters the provider's branches.
const AddBranchControl = React.memo(
  ({ orgId, repoId, provider, monitored, onAdd }: AddBranchControlProps) => {
    const [query, setQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const debouncedQuery = useDebounce(query.trim(), BRANCH_SEARCH_DEBOUNCE_MS);

    const {
      data: repoBranches,
      isLoading,
      isFetching,
      isError,
      error,
      refetch,
    } = useRepoBranches(orgId, repoId, debouncedQuery, true);

    const available = useMemo(
      () =>
        (repoBranches?.branches ?? []).filter(
          (branch) => !monitored.includes(branch),
        ),
      [repoBranches?.branches, monitored],
    );

    const isSearching = query.trim() !== "";
    const isCollapsed =
      !isSearching &&
      !isExpanded &&
      available.length > BRANCH_CHIPS_COLLAPSED_LIMIT;

    const visible = useMemo(
      () =>
        isCollapsed
          ? available.slice(0, BRANCH_CHIPS_COLLAPSED_LIMIT)
          : available,
      [available, isCollapsed],
    );

    // Small repos keep the plain chip row; the box shows up only when the
    // list is long or capped by the BE.
    const showSearch =
      isSearching ||
      !!repoBranches?.truncated ||
      (repoBranches?.branches.length ?? 0) > BRANCH_CHIPS_COLLAPSED_LIMIT;

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
            {isSearching
              ? `No branches match "${query.trim()}".`
              : "Every branch in this repository is already monitored."}
          </span>
        );
      }

      return (
        <>
          {visible.map((branch) => (
            <button
              key={branch}
              type="button"
              onClick={() => onAdd(branch)}
              aria-label={`Monitor ${branch}`}
              className={CHIP_CLASS}
            >
              + {branch}
            </button>
          ))}
          {!isSearching && available.length > BRANCH_CHIPS_COLLAPSED_LIMIT && (
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              aria-expanded={isExpanded}
              className="cursor-pointer rounded-full px-2 py-1 font-mono text-[11.5px] text-primary-300 hover:underline"
            >
              {isExpanded
                ? "Show less"
                : `+${available.length - BRANCH_CHIPS_COLLAPSED_LIMIT} more`}
            </button>
          )}
        </>
      );
    };

    return (
      <div className="flex flex-col gap-2.5 border-b border-border-row px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11.5px] text-text-muted">From repo:</span>
          {showSearch && (
            <label className="flex w-64 items-center gap-2 rounded-md border border-border-default bg-raised px-2.5 py-1.5 focus-within:border-neutral-600">
              <Icon
                icon="TbSearch"
                size={13}
                className="shrink-0 text-text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search branches…"
                aria-label="Search branches"
                className="min-w-0 flex-1 bg-transparent font-mono text-[11.5px] text-neutral-100 outline-none placeholder:text-text-muted"
              />
              {isFetching && isSearching && (
                <Spinner size={12} className="shrink-0 text-text-muted" />
              )}
            </label>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">{renderChips()}</div>
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
