import { describe, expect, it } from "vitest";

import type {
  PullRequestReview,
  PullRequestReviewer,
} from "@/lib/types/pull-request.types";

import {
  getReviewersOverview,
  sortReviewers,
  upsertReviewer,
} from "../pull-request.helper";

const entry = (
  id: string,
  overrides: Partial<PullRequestReviewer> = {},
): PullRequestReviewer => ({
  reviewId: `rev_${id}`,
  reviewer: { id: `u_${id}`, name: id, avatarUrl: null },
  decision: "approve",
  headSha: "sha",
  outdated: false,
  aiAssisted: false,
  sync: { status: "synced", error: null },
  createdAt: "2026-10-12T03:00:00Z",
  ...overrides,
});

describe("sortReviewers", () => {
  it("puts outdated decisions last, newest first within each group", () => {
    const sorted = sortReviewers([
      entry("old-outdated", {
        outdated: true,
        createdAt: "2026-10-01T00:00:00Z",
      }),
      entry("older", { createdAt: "2026-10-10T00:00:00Z" }),
      entry("new-outdated", {
        outdated: true,
        createdAt: "2026-10-11T00:00:00Z",
      }),
      entry("newest", { createdAt: "2026-10-12T00:00:00Z" }),
    ]);

    expect(sorted.map((item) => item.reviewId)).toEqual([
      "rev_newest",
      "rev_older",
      "rev_new-outdated",
      "rev_old-outdated",
    ]);
  });
});

describe("getReviewersOverview", () => {
  it("counts decisions on the current commit and tallies outdated ones", () => {
    const overview = getReviewersOverview([
      entry("a"),
      entry("b"),
      entry("c", { decision: "request_changes" }),
      entry("d", { outdated: true }),
      entry("e", { decision: "request_changes", outdated: true }),
    ]);

    expect(overview.current.map((item) => item.reviewId)).toEqual([
      "rev_a",
      "rev_b",
      "rev_c",
    ]);
    expect(overview).toMatchObject({
      approvals: 2,
      changeRequests: 1,
      outdated: 2,
    });
  });

  it("is all zeros without reviewers", () => {
    expect(getReviewersOverview([])).toEqual({
      current: [],
      approvals: 0,
      changeRequests: 0,
      outdated: 0,
    });
  });
});

describe("upsertReviewer", () => {
  const review = {
    id: "rev_new",
    decision: "request_changes",
    headSha: "sha2",
    reviewer: { id: "u_b", name: "b", avatarUrl: null },
    outdated: false,
    aiAssisted: true,
    sync: { status: "pending", error: null, syncedAt: null },
    createdAt: "2026-10-13T00:00:00Z",
  } as PullRequestReview;

  it("replaces the reviewer's previous entry and puts the new one first", () => {
    const next = upsertReviewer(
      [entry("a"), entry("b", { outdated: true })],
      review,
    );

    expect(next.map((item) => item.reviewId)).toEqual(["rev_new", "rev_a"]);
    expect(next[0]).toMatchObject({
      decision: "request_changes",
      aiAssisted: true,
      sync: { status: "pending", error: null },
    });
  });

  it("works before the detail had reviewers", () => {
    expect(upsertReviewer(undefined, review)).toHaveLength(1);
  });
});
