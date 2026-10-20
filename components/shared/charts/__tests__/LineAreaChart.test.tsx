import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LineAreaChart, { type ChartSeries } from "../LineAreaChart";

const LABELS = ["W1", "W2", "W3"];
const SERIES: ChartSeries[] = [
  { key: "static", label: "Static", color: "red", values: [4, 2, 6] },
  { key: "ai", label: "AI", color: "purple", values: [1, 3, 0] },
];

const renderChart = (series = SERIES) =>
  render(
    <LineAreaChart
      series={series}
      labels={LABELS}
      ariaLabel="Critical issues per week"
      formatTooltip={(index) => `Week ${index + 1} range`}
      emptyMessage="No critical issues in this period"
    />,
  );

describe("LineAreaChart", () => {
  it("labels the chart and draws a dot per value", () => {
    const { container } = renderChart();

    expect(
      screen.getByRole("group", { name: "Critical issues per week" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("circle")).toHaveLength(6);
    expect(screen.getByText("W3")).toBeInTheDocument();
    // max 6 → 0/2/4/6
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(
      screen.queryByText("No critical issues in this period"),
    ).not.toBeInTheDocument();
  });

  it("shows a tooltip with every series when a week gets focus", () => {
    renderChart();

    fireEvent.focus(screen.getByLabelText("W2: Static 2, AI 3"));
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Week 2 range");
    expect(tooltip).toHaveTextContent("Static2");
    expect(tooltip).toHaveTextContent("AI3");

    fireEvent.blur(screen.getByLabelText("W2: Static 2, AI 3"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens the tooltip on hover too", () => {
    renderChart();

    fireEvent.mouseEnter(screen.getByLabelText("W1: Static 4, AI 1"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Week 1 range");
  });

  it("keeps a flat line and explains an all-zero period", () => {
    const { container } = renderChart(
      SERIES.map((item) => ({ ...item, values: [0, 0, 0] })),
    );

    expect(
      screen.getByText("No critical issues in this period"),
    ).toBeInTheDocument();
    const ys = Array.from(container.querySelectorAll("circle")).map((dot) =>
      dot.getAttribute("cy"),
    );
    expect(new Set(ys).size).toBe(1);
  });
});
