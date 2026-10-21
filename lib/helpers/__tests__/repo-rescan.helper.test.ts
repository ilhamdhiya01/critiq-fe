import { describe, expect, it } from "vitest";

import { formatRepoRescanResult } from "../repository.helper";

describe("formatRepoRescanResult", () => {
  it("counts re-scanned PRs and only mentions non-zero skips", () => {
    expect(
      formatRepoRescanResult({
        enqueued: 2,
        skippedUpToDate: 0,
        skippedInFlight: 0,
      }),
    ).toBe("2 PR di-scan ulang");
    expect(
      formatRepoRescanResult({
        enqueued: 2,
        skippedUpToDate: 1,
        skippedInFlight: 3,
      }),
    ).toBe(
      "2 PR di-scan ulang · 3 dilewati karena scan masih berjalan · 1 sudah up to date",
    );
  });

  it("explains why nothing was re-scanned", () => {
    expect(
      formatRepoRescanResult({
        enqueued: 0,
        skippedUpToDate: 4,
        skippedInFlight: 0,
      }),
    ).toBe("Tidak ada PR yang di-scan ulang · 4 sudah up to date");
    expect(
      formatRepoRescanResult({
        enqueued: 0,
        skippedUpToDate: 0,
        skippedInFlight: 0,
      }),
    ).toBe("Tidak ada PR yang di-scan ulang");
  });
});
