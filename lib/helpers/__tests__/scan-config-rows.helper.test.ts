import { describe, expect, it } from "vitest";

import type { BranchPolicyEntry } from "@/lib/types/repository.types";

import { setRowPolicy } from "../scan-config.helper";

const ROWS: BranchPolicyEntry[] = [
  { branch: "main", policy: "require_both" },
  { branch: "develop", policy: "allow_ai" },
];

describe("scan-config.helper (setRowPolicy)", () => {
  it("changes only the matching branch", () => {
    expect(setRowPolicy(ROWS, "develop", "manual_only")).toEqual([
      { branch: "main", policy: "require_both" },
      { branch: "develop", policy: "manual_only" },
    ]);
  });

  it("does not mutate the original rows", () => {
    setRowPolicy(ROWS, "main", "manual_only");

    expect(ROWS[0].policy).toBe("require_both");
  });

  it("leaves the rows unchanged for an unknown branch", () => {
    expect(setRowPolicy(ROWS, "release", "manual_only")).toEqual(ROWS);
  });
});
