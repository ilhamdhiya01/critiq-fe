import { describe, expect, it } from "vitest";

import type { ReviewActivityItem } from "@/lib/types/activity.types";

import { groupActivityByDay } from "../activity.helper";

// Day boundaries follow the browser's zone (UTC+7, no DST).
process.env.TZ = "Asia/Jakarta";

const item = (id: string, createdAt: string): ReviewActivityItem => ({
  id,
  decision: "approve",
  aiAssisted: false,
  sync: { status: "synced" },
  reviewer: { id: "u1", name: "Priya", avatarUrl: null },
  pull: {
    id: "pr_1",
    number: "1",
    title: "x",
    repoId: "repo_1",
    repoPath: "acme/web",
  },
  createdAt,
});

// 19 Oct 2026, 10:00 in Jakarta.
const NOW = new Date("2026-10-19T03:00:00Z");

const labels = (items: ReviewActivityItem[]) =>
  groupActivityByDay(items, NOW).map((group) => [
    group.label,
    group.items.map((entry) => entry.id),
  ]);

describe("groupActivityByDay", () => {
  it("splits at local midnight, not UTC midnight", () => {
    expect(
      labels([
        item("a", "2026-10-18T17:10:00Z"), // 19 Oct 00:10 local → today
        item("b", "2026-10-18T16:50:00Z"), // 18 Oct 23:50 local → yesterday
      ]),
    ).toEqual([
      ["TODAY", ["a"]],
      ["YESTERDAY", ["b"]],
    ]);
  });

  it("labels the rest of the week and older days by date", () => {
    expect(
      labels([
        item("c", "2026-10-16T05:00:00Z"), // 3 days ago
        item("d", "2026-10-09T05:00:00Z"), // 10 days ago
      ]),
    ).toEqual([
      ["EARLIER THIS WEEK", ["c"]],
      ["9 OCT 2026", ["d"]],
    ]);
  });

  it("joins a day that was split across two loaded pages", () => {
    const pageOne = [item("e", "2026-10-18T10:00:00Z")];
    const pageTwo = [item("f", "2026-10-18T09:00:00Z")];

    expect(labels([...pageOne, ...pageTwo])).toEqual([
      ["YESTERDAY", ["e", "f"]],
    ]);
  });

  it("returns no groups for no items", () => {
    expect(groupActivityByDay([], NOW)).toEqual([]);
  });
});
