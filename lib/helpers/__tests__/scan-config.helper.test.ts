import { describe, expect, it } from "vitest";

import type { ScanConfig } from "@/lib/types/repository.types";

import {
  addBranchRow,
  applyPolicyToAll,
  buildScanConfigUpdate,
  isScanConfigDirty,
  mapScanConfigErrors,
  removeBranchRow,
  supportsPolicies,
  toPolicyRows,
} from "../scan-config.helper";

const CONFIG: ScanConfig = {
  defaultBranch: "main",
  branches: ["main", "develop"],
  policies: [
    { branch: "main", policy: "require_both" },
    { branch: "develop", policy: "allow_ai" },
  ],
  missing: [],
  missingCheckStatus: "not_available",
  defaultBranchChangedAt: null,
};

describe("scan-config helpers", () => {
  it("builds one row per branch with its policy", () => {
    expect(supportsPolicies(CONFIG)).toBe(true);
    expect(toPolicyRows(CONFIG)).toEqual([
      { branch: "main", policy: "require_both" },
      { branch: "develop", policy: "allow_ai" },
    ]);
  });

  it("detects an older BE without policies", () => {
    const legacy = { ...CONFIG, policies: undefined };
    expect(supportsPolicies(legacy)).toBe(false);
    expect(toPolicyRows(legacy).map((row) => row.branch)).toEqual([
      "main",
      "develop",
    ]);
  });

  it("applies one policy to every row", () => {
    expect(
      applyPolicyToAll(toPolicyRows(CONFIG), "manual_only").map(
        (row) => row.policy,
      ),
    ).toEqual(["manual_only", "manual_only"]);
  });

  it("gives a new branch the default branch's policy", () => {
    const rows = addBranchRow(toPolicyRows(CONFIG), "staging", "main");
    expect(rows.at(-1)).toEqual({ branch: "staging", policy: "require_both" });
    expect(addBranchRow(rows, "staging", "main")).toBe(rows);
  });

  it("never removes the default branch", () => {
    const rows = toPolicyRows(CONFIG);
    expect(removeBranchRow(rows, "main", "main")).toBe(rows);
    expect(removeBranchRow(rows, "develop", "main")).toEqual([
      { branch: "main", policy: "require_both" },
    ]);
  });

  it("sends branches plus a policy for every row", () => {
    const rows = toPolicyRows(CONFIG);
    expect(buildScanConfigUpdate(rows, true)).toEqual({
      branches: ["main", "develop"],
      policies: rows,
    });
    expect(buildScanConfigUpdate(rows, false)).toEqual({
      branches: ["main", "develop"],
    });
  });

  it("detects changes", () => {
    const saved = toPolicyRows(CONFIG);
    expect(isScanConfigDirty(saved, saved)).toBe(false);
    expect(isScanConfigDirty(saved, applyPolicyToAll(saved, "allow_ai"))).toBe(
      true,
    );
    expect(isScanConfigDirty(saved, addBranchRow(saved, "x", "main"))).toBe(
      true,
    );
  });

  it("maps 422 errors to rows or the form", () => {
    const rows = toPolicyRows(CONFIG);
    expect(
      mapScanConfigErrors(
        [
          {
            field: "policies[1].branch",
            message: "policy_branch_not_in_scope",
          },
          { field: "policies", message: "duplicate_policy_branch" },
        ],
        rows,
      ),
    ).toEqual({
      rowErrors: {
        develop: "A policy was set for a branch that is not monitored.",
      },
      formError: "This branch has more than one policy.",
    });
  });

  it("puts 422 unknown_branch on the row it names", () => {
    const rows = [
      ...toPolicyRows(CONFIG),
      { branch: "ghost", policy: "allow_ai" as const },
    ];

    expect(
      mapScanConfigErrors(
        [{ field: "branches", message: "unknown_branch", branch: "ghost" }],
        rows,
      ),
    ).toEqual({
      rowErrors: { ghost: "This branch no longer exists in the repository." },
      formError: null,
    });
  });
});
