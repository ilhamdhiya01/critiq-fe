import {
  DEFAULT_BRANCH_POLICY,
  SCAN_CONFIG_ERROR_MESSAGE,
} from "@/const/repository.constant";
import type { ApiFieldError } from "@/lib/types/api.types";
import type {
  BranchPolicy,
  BranchPolicyEntry,
  ScanConfig,
  UpdateScanConfigInput,
} from "@/lib/types/repository.types";

// Older BE versions do not send `policies`; the policy column is hidden then.
export const supportsPolicies = (config: ScanConfig): boolean =>
  Array.isArray(config.policies);

export const toPolicyRows = (config: ScanConfig): BranchPolicyEntry[] =>
  config.branches.map((branch) => ({
    branch,
    policy:
      config.policies?.find((entry) => entry.branch === branch)?.policy ??
      DEFAULT_BRANCH_POLICY,
  }));

export const setRowPolicy = (
  rows: BranchPolicyEntry[],
  branch: string,
  policy: BranchPolicy,
): BranchPolicyEntry[] =>
  rows.map((row) => (row.branch === branch ? { ...row, policy } : row));

export const applyPolicyToAll = (
  rows: BranchPolicyEntry[],
  policy: BranchPolicy,
): BranchPolicyEntry[] => rows.map((row) => ({ ...row, policy }));

// A newly added branch starts with the default branch's current policy.
export const addBranchRow = (
  rows: BranchPolicyEntry[],
  branch: string,
  defaultBranch: string,
): BranchPolicyEntry[] => {
  if (rows.some((row) => row.branch === branch)) return rows;
  const policy =
    rows.find((row) => row.branch === defaultBranch)?.policy ??
    DEFAULT_BRANCH_POLICY;
  return [...rows, { branch, policy }];
};

export const removeBranchRow = (
  rows: BranchPolicyEntry[],
  branch: string,
  defaultBranch: string,
): BranchPolicyEntry[] =>
  branch === defaultBranch ? rows : rows.filter((row) => row.branch !== branch);

// Sends a policy for every row — explicit rather than a diff.
export const buildScanConfigUpdate = (
  rows: BranchPolicyEntry[],
  withPolicies: boolean,
): UpdateScanConfigInput => ({
  branches: rows.map((row) => row.branch),
  ...(withPolicies ? { policies: rows } : {}),
});

export const isScanConfigDirty = (
  saved: BranchPolicyEntry[],
  rows: BranchPolicyEntry[],
): boolean =>
  saved.length !== rows.length ||
  saved.some(
    (entry) =>
      rows.find((row) => row.branch === entry.branch)?.policy !== entry.policy,
  );

export interface ScanConfigErrors {
  rowErrors: Record<string, string>;
  formError: string | null;
}

const INDEXED_FIELD = /^(?:policies|branches)\[(\d+)\]/;

// Errors that name a row (`branch: "ghost"`, `policies[2].branch`,
// `branches[1]`, or the branch name as `field`) are shown on that row; the
// rest above the table.
export const mapScanConfigErrors = (
  errors: ApiFieldError[],
  sentRows: BranchPolicyEntry[],
): ScanConfigErrors =>
  errors.reduce<ScanConfigErrors>(
    (acc, error) => {
      const message = SCAN_CONFIG_ERROR_MESSAGE[error.message] ?? error.message;
      const index = INDEXED_FIELD.exec(error.field ?? "")?.[1];
      const branch =
        sentRows.find((row) => row.branch === error.branch)?.branch ??
        (index !== undefined
          ? sentRows[Number(index)]?.branch
          : sentRows.find((row) => row.branch === error.field)?.branch);

      if (branch) acc.rowErrors[branch] = message;
      else acc.formError ??= message;
      return acc;
    },
    { rowErrors: {}, formError: null },
  );
