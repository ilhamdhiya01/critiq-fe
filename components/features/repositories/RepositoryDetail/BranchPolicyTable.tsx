"use client";

import React, { useCallback, useMemo, useState } from "react";

import SectionCard from "@/components/shared/section-card";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import Notice from "@/components/ui/notice";
import SegmentedControl from "@/components/ui/segmented-control";
import {
  BRANCH_POLICY_SEGMENTS,
  BRANCHES_MUST_EXIST_NOTE,
  FINAL_APPROVAL_NOTE,
  SCAN_CONFIG_HELP_TEXT,
} from "@/const/repository.constant";
import {
  addBranchRow,
  applyPolicyToAll,
  buildScanConfigUpdate,
  isScanConfigDirty,
  removeBranchRow,
  setRowPolicy,
  supportsPolicies,
  toPolicyRows,
} from "@/lib/helpers/scan-config.helper";
import { useUpdateScanConfig } from "@/lib/hooks/repositories/useUpdateScanConfig";
import type { IntegrationProvider } from "@/lib/types/integration.types";
import type {
  BranchPolicy,
  BranchPolicyEntry,
  ScanConfig,
} from "@/lib/types/repository.types";

import AddBranchControl from "./AddBranchControl";
import PolicyRow from "./PolicyRow";

interface BranchPolicyTableProps {
  orgId: string;
  repoId: string;
  provider: IntegrationProvider;
  config: ScanConfig;
  isAdmin: boolean;
}

const BranchPolicyTable = React.memo(
  ({ orgId, repoId, provider, config, isAdmin }: BranchPolicyTableProps) => {
    const savedRows = useMemo(() => toPolicyRows(config), [config]);
    const withPolicies = supportsPolicies(config);
    const defaultBranch = config.defaultBranch;

    // null = no local edits; the table shows the saved config.
    const [draft, setDraft] = useState<BranchPolicyEntry[] | null>(null);
    const rows = draft ?? savedRows;
    const isDirty = isScanConfigDirty(savedRows, rows);

    const { handleSaveScanConfig, isSaving, saveErrors, clearSaveErrors } =
      useUpdateScanConfig(orgId, repoId);

    const updateRows = useCallback(
      (update: (current: BranchPolicyEntry[]) => BranchPolicyEntry[]) => {
        setDraft((current) => update(current ?? savedRows));
        clearSaveErrors();
      },
      [savedRows, clearSaveErrors],
    );

    const handlePolicyChange = useCallback(
      (branch: string, policy: BranchPolicy) =>
        updateRows((current) => setRowPolicy(current, branch, policy)),
      [updateRows],
    );

    const handleRemove = useCallback(
      (branch: string) =>
        updateRows((current) =>
          removeBranchRow(current, branch, defaultBranch),
        ),
      [updateRows, defaultBranch],
    );

    const handleApplyAll = useCallback(
      (policy: BranchPolicy) =>
        updateRows((current) => applyPolicyToAll(current, policy)),
      [updateRows],
    );

    const handleAdd = useCallback(
      (branch: string) =>
        updateRows((current) => addBranchRow(current, branch, defaultBranch)),
      [updateRows, defaultBranch],
    );

    const monitored = useMemo(() => rows.map((row) => row.branch), [rows]);

    // Highlights the shared policy when every row already uses it.
    const sharedPolicy = rows.every((row) => row.policy === rows[0]?.policy)
      ? (rows[0]?.policy ?? null)
      : null;

    const handleDiscard = () => {
      setDraft(null);
      clearSaveErrors();
    };

    const handleSave = async () => {
      const isSaved = await handleSaveScanConfig(
        buildScanConfigUpdate(rows, withPolicies),
        rows,
      );
      if (isSaved) setDraft(null);
    };

    return (
      <SectionCard
        title={withPolicies ? "Branches & review policy" : "Monitored branches"}
        meta={`${rows.length} monitored`}
      >
        <div className="flex items-start gap-2 border-b border-border-row px-5 py-3">
          <Icon
            icon="TbInfoCircle"
            size={14}
            className="mt-px flex-none text-text-secondary"
          />
          <span className="text-[11.5px] leading-normal text-text-nav">
            {SCAN_CONFIG_HELP_TEXT} {BRANCHES_MUST_EXIST_NOTE}
          </span>
        </div>

        {saveErrors.formError && (
          <Notice tone="danger" variant="row">
            {saveErrors.formError}
          </Notice>
        )}

        {isAdmin && withPolicies && rows.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-row bg-raised/40 px-5 py-2.5">
            <span className="text-[11.5px] text-text-secondary">
              Apply to all branches
            </span>
            <SegmentedControl
              size="sm"
              options={BRANCH_POLICY_SEGMENTS}
              value={sharedPolicy}
              onChange={handleApplyAll}
              ariaLabel="Apply a review policy to all branches"
            />
          </div>
        )}

        <div className="flex flex-col">
          {rows.map((row) => (
            <PolicyRow
              key={row.branch}
              row={row}
              isDefault={row.branch === defaultBranch}
              isAdmin={isAdmin}
              showPolicy={withPolicies}
              error={saveErrors.rowErrors[row.branch]}
              onPolicyChange={handlePolicyChange}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="border-t border-border-row">
            <AddBranchControl
              orgId={orgId}
              repoId={repoId}
              provider={provider}
              monitored={monitored}
              onAdd={handleAdd}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span className="flex items-center gap-2 text-[11.5px] text-text-nav">
            <Icon
              icon="TbShieldCheck"
              size={14}
              className="text-text-secondary"
            />
            {FINAL_APPROVAL_NOTE}
          </span>
          {isAdmin && (
            <span className="flex items-center gap-2.5">
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onClick={handleDiscard}
                  disabled={isSaving}
                >
                  Discard changes
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                fullWidth={false}
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                isLoading={isSaving}
              >
                Save
              </Button>
            </span>
          )}
        </div>
      </SectionCard>
    );
  },
);

BranchPolicyTable.displayName = "BranchPolicyTable";

export default BranchPolicyTable;
