import { describe, expect, it } from "vitest";

import {
  getNiceScale,
  getPoints,
  toAreaPath,
  toLinePath,
} from "../chart.helper";

describe("getNiceScale", () => {
  it.each([
    [0, 3, 1, [0, 1, 2, 3]],
    [1, 3, 1, [0, 1, 2, 3]],
    [3, 3, 1, [0, 1, 2, 3]],
    [5, 6, 2, [0, 2, 4, 6]],
    [14, 15, 5, [0, 5, 10, 15]],
    [1234, 1500, 500, [0, 500, 1000, 1500]],
  ])("%i → max %i, step %i", (value, max, step, ticks) => {
    expect(getNiceScale(value)).toEqual({ max, step, ticks });
  });

  it("always uses 1/2/5 × 10ⁿ steps and 3–4 gridlines", () => {
    for (let value = 0; value <= 5000; value += 7) {
      const scale = getNiceScale(value);
      const lead = scale.step / 10 ** Math.floor(Math.log10(scale.step));
      expect([1, 2, 5]).toContain(Math.round(lead));
      expect(scale.max).toBeGreaterThanOrEqual(value);
      expect(scale.ticks.length).toBeGreaterThanOrEqual(3);
      expect(scale.ticks.length).toBeLessThanOrEqual(5);
    }
  });
});

describe("chart paths", () => {
  it("draws an all-zero series as a flat line on the baseline", () => {
    const points = getPoints([0, 0, 0, 0], {
      width: 300,
      height: 200,
      max: getNiceScale(0).max,
    });
    expect(points.map((point) => point.y)).toEqual([200, 200, 200, 200]);
    expect(toLinePath(points)).toBe("M0,200 L100,200 L200,200 L300,200");
  });

  it("maps values to pixels with y growing downwards", () => {
    const points = getPoints([0, 5, 10], { width: 200, height: 100, max: 10 });
    expect(points).toEqual([
      { x: 0, y: 100 },
      { x: 100, y: 50 },
      { x: 200, y: 0 },
    ]);
    expect(toAreaPath(points, 100)).toBe(
      "M0,100 L100,50 L200,0 L200,100 L0,100 Z",
    );
  });

  it("centres a single point and handles empty data", () => {
    const points = getPoints([4], { width: 200, height: 100, max: 4 });
    expect(points).toEqual([{ x: 100, y: 0 }]);
    expect(toLinePath(points)).toBe("M100,0");
    expect(toAreaPath([], 100)).toBe("");
  });
});
