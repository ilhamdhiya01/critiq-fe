import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import LineAreaChart, { type ChartSeries } from "../LineAreaChart";

const LABELS = ["W1", "W2", "W3"];
const SERIES: ChartSeries[] = [
  { key: "static", label: "Static", color: "red", values: [4, 2, 6] },
  { key: "ai", label: "AI", color: "purple", values: [1, 3, 0] },
];

const renderChart = (series = SERIES, labels = LABELS) =>
  render(
    <LineAreaChart
      series={series}
      labels={labels}
      ariaLabel="Critical issues per week"
      formatTooltip={(index) => `Week ${index + 1} range`}
      emptyMessage="No critical issues in this period"
    />,
  );

// Reports a fixed container width, like a phone-sized card.
const stubContainerWidth = (width: number) =>
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe() {
        this.callback(
          [{ contentRect: { width } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }
      disconnect() {}
    },
  );

describe("LineAreaChart", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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

  it("opens the tooltip on tap and follows a horizontal drag", () => {
    renderChart();

    fireEvent.pointerDown(screen.getByLabelText("W2: Static 2, AI 3"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Week 2 range");

    fireEvent.pointerMove(screen.getByLabelText("W3: Static 6, AI 0"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Week 3 range");
  });

  it("keeps the tooltip inside the chart at the first and last point", () => {
    renderChart();

    // Default width 640, left pad 38, right pad 14 → points at x 38…626.
    fireEvent.focus(screen.getByLabelText("W1: Static 4, AI 1"));
    expect(screen.getByRole("tooltip").style.transform).toBe(
      "translateX(clamp(-38px, -50%, calc(602px - 100%)))",
    );

    fireEvent.focus(screen.getByLabelText("W3: Static 6, AI 0"));
    expect(screen.getByRole("tooltip").style.transform).toBe(
      "translateX(clamp(-626px, -50%, calc(14px - 100%)))",
    );
  });

  it("thins x-axis labels that would overlap on a narrow chart", () => {
    stubContainerWidth(160);
    const labels = Array.from({ length: 8 }, (_, index) => `W${index + 1}`);
    renderChart(
      SERIES.map((item) => ({ ...item, values: labels.map(() => 1) })),
      labels,
    );

    expect(screen.getByText("W1")).toBeInTheDocument();
    expect(screen.queryByText("W2")).not.toBeInTheDocument();
    expect(screen.getByText("W3")).toBeInTheDocument();
    // Hidden labels stay inspectable.
    expect(screen.getByLabelText("W2: Static 1, AI 1")).toBeInTheDocument();
  });

  it("shows every label when there is room", () => {
    renderChart();

    LABELS.forEach((label) => expect(screen.getByText(label)).toBeVisible());
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
