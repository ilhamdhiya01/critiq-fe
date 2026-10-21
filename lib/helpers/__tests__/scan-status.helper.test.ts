import { describe, expect, it } from "vitest";

import { isScanInProgress, scanDisplayStatus } from "../scan-status.helper";

describe("scanDisplayStatus", () => {
  it("shows the static status until the static scan is done", () => {
    for (const status of [
      "QUEUED",
      "RUNNING",
      "FAILED",
      "SUPERSEDED",
    ] as const) {
      // Even while the AI part reports progress.
      expect(scanDisplayStatus({ status, aiStatus: "running" })).toEqual({
        kind: "static",
        status,
      });
    }
  });

  it("is AI reviewing while the AI half is queued or running", () => {
    expect(scanDisplayStatus({ status: "DONE", aiStatus: "queued" })).toEqual({
      kind: "ai_reviewing",
    });
    expect(scanDisplayStatus({ status: "DONE", aiStatus: "running" })).toEqual({
      kind: "ai_reviewing",
    });
  });

  it("reports a failed AI review with its error code", () => {
    expect(
      scanDisplayStatus({
        status: "DONE",
        aiStatus: "failed",
        aiErrorCode: "provider_timeout",
      }),
    ).toEqual({ kind: "ai_failed", errorCode: "provider_timeout" });
    expect(scanDisplayStatus({ status: "DONE", aiStatus: "failed" })).toEqual({
      kind: "ai_failed",
      errorCode: null,
    });
  });

  it("is a full Done when the AI review completed or was cached", () => {
    for (const aiStatus of ["done", "cached"] as const) {
      expect(scanDisplayStatus({ status: "DONE", aiStatus })).toEqual({
        kind: "done",
        isStaticOnly: false,
      });
    }
  });

  it("is Done · static only when the AI review was skipped, blocked or absent", () => {
    for (const aiStatus of [
      "skipped_manual_mode",
      "skipped_too_large",
      "consent_required",
      "not_configured",
      "budget_exceeded",
      null,
      undefined,
    ] as const) {
      expect(scanDisplayStatus({ status: "DONE", aiStatus })).toEqual({
        kind: "done",
        isStaticOnly: true,
      });
    }
  });

  it("treats a scan without a status (older payload) as finished", () => {
    expect(
      scanDisplayStatus({ status: undefined as never, aiStatus: "done" }),
    ).toEqual({ kind: "done", isStaticOnly: false });
  });

  it("accepts the BE's lower-case static status", () => {
    expect(
      scanDisplayStatus({
        status: "done" as never,
        aiStatus: "running",
      }),
    ).toEqual({ kind: "ai_reviewing" });
    expect(scanDisplayStatus({ status: "running" as never })).toEqual({
      kind: "static",
      status: "RUNNING",
    });
  });
});

describe("isScanInProgress", () => {
  it("is true until both halves have settled", () => {
    expect(isScanInProgress({ status: "QUEUED" })).toBe(true);
    expect(isScanInProgress({ status: "RUNNING" })).toBe(true);
    expect(isScanInProgress({ status: "DONE", aiStatus: "running" })).toBe(
      true,
    );

    expect(isScanInProgress({ status: "DONE", aiStatus: "done" })).toBe(false);
    expect(isScanInProgress({ status: "DONE", aiStatus: "failed" })).toBe(
      false,
    );
    expect(isScanInProgress({ status: "DONE", aiStatus: null })).toBe(false);
    expect(isScanInProgress({ status: "FAILED" })).toBe(false);
    expect(isScanInProgress({ status: "SUPERSEDED" })).toBe(false);
  });
});
