"use client";

import React from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import { BRANCH_POLICY_OPTIONS } from "@/const/repository.constant";
import type {
  BranchPolicy,
  BranchPolicyEntry,
} from "@/lib/types/repository.types";

import PolicySegmented from "./PolicySegmented";

interface PolicyRowProps {
  row: BranchPolicyEntry;
  isDefault: boolean;
  isAdmin: boolean;
  showPolicy: boolean;
  error?: string;
  onPolicyChange: (branch: string, policy: BranchPolicy) => void;
  onRemove: (branch: string) => void;
}

const PolicyRow = React.memo(
  ({
    row,
    isDefault,
    isAdmin,
    showPolicy,
    error,
    onPolicyChange,
    onRemove,
  }: PolicyRowProps) => {
    const policyLabel = BRANCH_POLICY_OPTIONS.find(
      (option) => option.value === row.policy,
    )?.label;

    return (
      <div className="flex flex-col gap-1.5 border-b border-border-row px-5 py-3 last:border-b-0">
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <Icon
              icon="TbGitBranch"
              size={15}
              className="flex-none text-text-secondary"
            />
            <span className="truncate font-mono text-[12.5px] text-text-strong">
              {row.branch}
            </span>
            {isDefault && (
              <span className="font-mono text-[9.5px] tracking-[.06em] text-text-muted uppercase">
                default
              </span>
            )}
          </span>

          {showPolicy &&
            (isAdmin ? (
              <PolicySegmented
                value={row.policy}
                onChange={(policy) => onPolicyChange(row.branch, policy)}
                ariaLabel={`Review policy for ${row.branch}`}
              />
            ) : (
              <span className="font-mono text-[11.5px] text-text-secondary">
                {policyLabel}
              </span>
            ))}

          {isAdmin && (
            <span className="flex w-7 justify-center">
              {!isDefault && (
                <Button
                  type="button"
                  variant="icon"
                  size="sm"
                  fullWidth={false}
                  aria-label={`Stop monitoring ${row.branch}`}
                  title="Stop monitoring this branch"
                  icon={<Icon icon="TbX" size={14} />}
                  onClick={() => onRemove(row.branch)}
                  className="hover:bg-danger/10 hover:text-danger-light"
                />
              )}
            </span>
          )}
        </div>

        {error && (
          <span className="flex items-center gap-1.5 pl-6.5 text-[11px] text-danger-light">
            <Icon icon="TbAlertTriangle" size={12} />
            {error}
          </span>
        )}
      </div>
    );
  },
);

PolicyRow.displayName = "PolicyRow";

export default PolicyRow;
