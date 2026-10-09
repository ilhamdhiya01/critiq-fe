import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { getOrgRepositories } from "@/services/repositories.service";

import RepositoryList from "../RepositoryList";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
}));

vi.mock("@/services/repositories.service", () => ({
  getOrgRepositories: vi.fn(),
}));

// First render in a cold worker can exceed the 5s default under load.
describe("RepositoryList", { timeout: 15_000 }, () => {
  it("renders real data only — no gate or rating badges", async () => {
    vi.mocked(getOrgRepositories).mockResolvedValue({
      data: [
        {
          id: "r1",
          provider: "GITHUB",
          path: "acme/critiq-core",
          defaultBranch: "main",
          monitoredBranchCount: 2,
          language: "TypeScript",
          openPullCount: 1,
          openCriticalCount: 4,
          lastScanAt: "2026-10-09T03:12:00Z",
        },
        {
          id: "r2",
          provider: "GITLAB",
          path: "acme/legacy",
          defaultBranch: "main",
          monitoredBranchCount: 1,
          language: null,
          openPullCount: 0,
          openCriticalCount: 0,
          lastScanAt: null,
        },
      ],
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <RepositoryList orgId="org_1" />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(/2 repositories connected/),
    ).toBeInTheDocument();
    expect(screen.getByText("critiq-core")).toBeInTheDocument();
    expect(screen.getByText("legacy")).toBeInTheDocument();

    // language: null → no dot
    expect(screen.getAllByTestId("language-dot")).toHaveLength(1);

    expect(screen.getByText("4 critical")).toHaveClass("text-danger-light");
    expect(screen.getByText("0 critical")).toHaveClass("text-text-muted");
    expect(screen.getByText("1 open PR")).toBeInTheDocument();

    for (const badge of ["PASSED", "FAILED", "A", "B", "C"]) {
      expect(screen.queryByText(badge)).not.toBeInTheDocument();
    }

    expect(screen.getByText("critiq-core").closest("a")).toHaveAttribute(
      "href",
      "/acme/repositories/r1",
    );
  });
});
