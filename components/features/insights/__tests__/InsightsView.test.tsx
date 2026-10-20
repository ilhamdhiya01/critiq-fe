import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { InsightsData } from "@/lib/types/insights.types";
import { getInsights } from "@/services/insights.service";

import InsightsView from "../InsightsView";

vi.mock("@/services/insights.service", () => ({
  getInsights: vi.fn(),
}));

const DATA: InsightsData = {
  criticalFound: { last30d: 33, previous30d: 50 },
  criticalResolved: { last30d: 21, previous30d: 18 },
  meanTimeToResolveHours: { last30d: 43.2, previous30d: 57.6 },
  weekly: [
    { weekStart: "2026-08-31", static: 4, ai: 1 },
    { weekStart: "2026-09-07", static: 6, ai: 2 },
    { weekStart: "2026-09-14", static: 3, ai: 0 },
  ],
  topRules: [
    {
      ruleId: "r1",
      label: "Hardcoded secret",
      source: "STATIC",
      count: 10,
    },
    { ruleId: "r2", label: "SQL injection", source: "AI", count: 6 },
    { ruleId: "r3", label: "Open redirect", source: "STATIC", count: 2 },
  ],
};

const mockInsights = (data: InsightsData) =>
  vi.mocked(getInsights).mockResolvedValue({ data });

const renderView = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <InsightsView orgId="org_1" />
    </QueryClientProvider>,
  );

const card = (label: string) =>
  screen.getByText(label).closest("div") as HTMLElement;

describe("InsightsView", { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(getInsights).mockReset();
  });

  it("shows found, resolved and MTTR with their trends", async () => {
    mockInsights(DATA);
    renderView();

    expect(await screen.findByText("33")).toBeInTheDocument();
    expect(getInsights).toHaveBeenCalledTimes(1);
    expect(getInsights).toHaveBeenCalledWith("org_1", 8);

    const critical = card("Critical issues found · last 30 days");
    expect(critical).toHaveTextContent("↓ 34% vs previous 30 days");

    const mttr = card("Mean time to resolve");
    expect(within(mttr).getByText("1.8 d")).toBeInTheDocument();
    expect(mttr).toHaveTextContent("↓ 14.4 h vs previous 30 days");
    expect(
      within(mttr).getByText(
        "Time from first detection until the finding no longer appears in the PR",
      ),
    ).toBeInTheDocument();

    const resolved = card("Critical resolved · last 30 days");
    expect(within(resolved).getByText("21")).toBeInTheDocument();
    expect(resolved).toHaveTextContent("↑ 3 vs previous 30 days");
    expect(within(resolved).getByText("↑ 3")).toHaveClass("text-success-light");
    expect(
      within(resolved).getByText(
        "Critical issues that no longer appear in their pull request (fixed, or the code was removed)",
      ),
    ).toBeInTheDocument();

    // Found → Resolved → MTTR.
    const labels = [
      "Critical issues found · last 30 days",
      "Critical resolved · last 30 days",
      "Mean time to resolve",
    ].map((label) => screen.getByText(label));
    expect(
      labels[0].compareDocumentPosition(labels[1]) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      labels[1].compareDocumentPosition(labels[2]) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(
      screen.queryByText("Top rule · last 30 days"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/AI suggestions accepted/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/AI-Assisted vs Manual/i),
    ).not.toBeInTheDocument();
  });

  it("draws both series and sizes top-rule bars against the largest", async () => {
    mockInsights(DATA);
    renderView();

    expect(
      await screen.findByText("Critical Issues Found Over Time"),
    ).toBeInTheDocument();
    expect(await screen.findByText("W3")).toBeInTheDocument();
    expect(screen.getByLabelText("W2: Static 6, AI 2")).toBeInTheDocument();

    const bars = screen.getAllByTestId("top-rule-bar");
    expect(bars.map((bar) => bar.style.width)).toEqual(["100%", "60%", "20%"]);
  });

  it("reads a zero baseline as new and a missing MTTR as —", async () => {
    mockInsights({
      ...DATA,
      criticalFound: { last30d: 4, previous30d: 0 },
      criticalResolved: { last30d: 2, previous30d: 0 },
      meanTimeToResolveHours: { last30d: null, previous30d: 12 },
    });
    renderView();

    const critical = await screen.findByText(
      "Critical issues found · last 30 days",
    );
    expect(critical.closest("div")).toHaveTextContent(
      "↑ new · none in the previous 30 days",
    );
    expect(critical.closest("div")).not.toHaveTextContent("%");
    expect(
      within(critical.closest("div") as HTMLElement).getByText("↑ new"),
    ).toHaveClass("text-danger-light");

    const resolved = card("Critical resolved · last 30 days");
    expect(resolved).toHaveTextContent("↑ new · none in the previous 30 days");
    expect(within(resolved).getByText("↑ new")).toHaveClass(
      "text-success-light",
    );

    const mttr = card("Mean time to resolve");
    expect(within(mttr).getByText("—")).toBeInTheDocument();
    expect(mttr).not.toHaveTextContent("vs previous");
  });

  it("colours fewer resolved red", async () => {
    mockInsights({
      ...DATA,
      criticalResolved: { last30d: 3, previous30d: 5 },
    });
    renderView();

    await screen.findByText("33");
    const resolved = card("Critical resolved · last 30 days");
    expect(resolved).toHaveTextContent("↓ 2 vs previous 30 days");
    expect(within(resolved).getByText("↓ 2")).toHaveClass("text-danger-light");
  });

  it("shows no change when resolved stays the same", async () => {
    mockInsights({ ...DATA, criticalResolved: { last30d: 5, previous30d: 5 } });
    renderView();

    await screen.findByText("33");
    const resolved = card("Critical resolved · last 30 days");
    expect(resolved).toHaveTextContent("→ no change vs previous 30 days");
    expect(within(resolved).getByText("→ no change")).toHaveClass(
      "text-text-secondary",
    );
  });

  it("shows empty states for a quiet org", async () => {
    mockInsights({
      criticalFound: { last30d: 0, previous30d: 0 },
      criticalResolved: { last30d: 0, previous30d: 0 },
      meanTimeToResolveHours: { last30d: null, previous30d: null },
      weekly: DATA.weekly.map((week) => ({ ...week, static: 0, ai: 0 })),
      topRules: [],
    });
    renderView();

    expect(
      await screen.findByText("No critical issues in this period"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No critical findings in the last 30 days."),
    ).toBeInTheDocument();
    expect(card("Critical resolved · last 30 days")).not.toHaveTextContent(
      "vs previous",
    );
  });

  it("shows an error per block when the request fails", async () => {
    vi.mocked(getInsights).mockRejectedValue(new Error("boom"));
    renderView();

    expect(
      await screen.findByText("Couldn't load insights."),
    ).toBeInTheDocument();
    expect(screen.getByText("Couldn't load the trend.")).toBeInTheDocument();
    expect(
      screen.getByText("Couldn't load the top rules."),
    ).toBeInTheDocument();
  });
});
