import { describe, expect, it } from "vitest";

import {
  formatMttr,
  formatWeekRange,
  getBarPercents,
  getMttrTrend,
  getPercentTrend,
  getResolvedTrend,
} from "../insights.helper";

describe("formatMttr", () => {
  it.each([
    [5, "5.0 h"],
    [23.94, "23.9 h"],
    [24, "1.0 d"],
    [43.2, "1.8 d"],
    [null, "—"],
  ])("%s → %s", (hours, expected) => {
    expect(formatMttr(hours)).toBe(expected);
  });
});

describe("getPercentTrend", () => {
  it("fewer criticals is good, more is bad", () => {
    expect(getPercentTrend(33, 50)).toEqual({
      kind: "change",
      direction: "down",
      tone: "good",
      text: "34%",
    });
    expect(getPercentTrend(15, 10)).toEqual({
      kind: "change",
      direction: "up",
      tone: "bad",
      text: "50%",
    });
  });

  it("never divides by a zero baseline", () => {
    expect(getPercentTrend(4, 0)).toEqual({ kind: "new", tone: "bad" });
    expect(getPercentTrend(0, 0)).toBeNull();
  });

  it("reads a rounded 0% as no change", () => {
    expect(getPercentTrend(1000, 1001)).toEqual({ kind: "same" });
  });
});

describe("getResolvedTrend", () => {
  it("more resolved is good, fewer is bad, shown as a count", () => {
    expect(getResolvedTrend(8, 5)).toEqual({
      kind: "change",
      direction: "up",
      tone: "good",
      text: "3",
    });
    expect(getResolvedTrend(3, 5)).toEqual({
      kind: "change",
      direction: "down",
      tone: "bad",
      text: "2",
    });
    expect(getResolvedTrend(0, 4)).toMatchObject({ tone: "bad", text: "4" });
    expect(getResolvedTrend(5, 5)).toEqual({ kind: "same" });
  });

  it("reads a zero baseline as new (good) and hides two zeros", () => {
    expect(getResolvedTrend(4, 0)).toEqual({ kind: "new", tone: "good" });
    expect(getResolvedTrend(0, 0)).toBeNull();
  });
});

describe("getMttrTrend", () => {
  it("shows the change in MTTR units", () => {
    expect(getMttrTrend(30, 44.4)).toEqual({
      kind: "change",
      direction: "down",
      tone: "good",
      text: "14.4 h",
    });
    expect(getMttrTrend(72, 57.6)).toMatchObject({
      direction: "up",
      tone: "bad",
    });
    expect(getMttrTrend(10, 10.01)).toEqual({ kind: "same" });
  });

  it("hides the trend without data on either side", () => {
    expect(getMttrTrend(null, 10)).toBeNull();
    expect(getMttrTrend(10, null)).toBeNull();
  });
});

describe("getBarPercents", () => {
  it("sizes bars relative to the largest count", () => {
    expect(getBarPercents([10, 6, 0])).toEqual([100, 60, 0]);
    expect(getBarPercents([0, 0])).toEqual([0, 0]);
    expect(getBarPercents([])).toEqual([]);
  });
});

describe("formatWeekRange", () => {
  it("formats Monday to Sunday, across a month boundary too", () => {
    expect(formatWeekRange("2026-10-13")).toBe("Oct 13 – Oct 19");
    expect(formatWeekRange("2026-09-28")).toBe("Sep 28 – Oct 4");
  });
});
