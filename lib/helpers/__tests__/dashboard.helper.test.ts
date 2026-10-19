import { describe, expect, it } from "vitest";

import {
  formatDurationHours,
  formatPullRef,
  getReviewSplit,
  getTurnaroundTrend,
} from "../dashboard.helper";

describe("formatDurationHours", () => {
  it.each([
    [null, "—"],
    [0.63, "38 min"],
    [0.999, "60 min"],
    [1, "1.0 h"],
    [4.6, "4.6 h"],
    [9.64, "9.6 h"],
  ] as const)("%s → %s", (hours, expected) => {
    expect(formatDurationHours(hours)).toBe(expected);
  });
});

describe("getTurnaroundTrend", () => {
  it("is good when reviews got faster", () => {
    expect(getTurnaroundTrend(4.6, 5.2333)).toEqual({
      direction: "down",
      tone: "good",
      text: "38 min",
    });
  });

  it("is bad when reviews got slower", () => {
    expect(getTurnaroundTrend(6, 4)).toEqual({
      direction: "up",
      tone: "bad",
      text: "2.0 h",
    });
  });

  it("is neutral when nothing changed", () => {
    expect(getTurnaroundTrend(3, 3)).toMatchObject({
      direction: "same",
      tone: "neutral",
    });
  });

  it.each([
    [null, 4],
    [4, null],
    [null, null],
  ] as const)("hides the trend without both weeks (%s / %s)", (a, b) => {
    expect(getTurnaroundTrend(a, b)).toBeNull();
  });
});

describe("getReviewSplit", () => {
  it("has nothing to split without reviews", () => {
    expect(getReviewSplit(0, 0)).toBeNull();
  });

  it("rounds the AI share and keeps the total at 100", () => {
    expect(getReviewSplit(442, 284)).toEqual({
      aiPercent: 64,
      manualPercent: 36,
    });
    const { aiPercent, manualPercent } = getReviewSplit(3, 1)!;
    expect(aiPercent + manualPercent).toBe(100);
  });
});

describe("formatPullRef", () => {
  it("uses the provider's number prefix and the short repo name", () => {
    expect(formatPullRef("GITHUB", "482", "acme/payments-api")).toBe(
      "#482 · payments-api",
    );
    expect(formatPullRef("GITLAB", "12", "acme/infra")).toBe("!12 · infra");
    expect(formatPullRef(undefined, "7", "acme/web")).toBe("#7 · web");
  });
});
