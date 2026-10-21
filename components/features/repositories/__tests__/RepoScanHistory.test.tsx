import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RepoScan } from "@/lib/types/repository.types";
import { getRepoScans } from "@/services/repositories.service";

import RepoScanHistory from "../RepositoryDetail/RepoScanHistory";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/services/repositories.service", () => ({
  getRepoScans: vi.fn(),
}));

const scan = (id: string, overrides: Partial<RepoScan>): RepoScan => ({
  id,
  status: "DONE",
  trigger: "WEBHOOK",
  criticalCount: 2,
  createdAt: "2026-10-12T03:00:00Z",
  finishedAt: "2026-10-12T03:01:00Z",
  pull: { id: `pr_${id}`, number: id, title: `PR ${id}` },
  ...overrides,
});

const rowOf = (prNumber: string) =>
  screen.getByText(`#${prNumber}`).closest("tr") as HTMLElement;

describe("RepoScanHistory", () => {
  it("combines the static and AI status of each scan", async () => {
    vi.mocked(getRepoScans).mockResolvedValue({
      data: [
        scan("1", { aiStatus: "running", criticalCount: 1 }),
        scan("2", { aiStatus: "failed", aiErrorCode: "provider_timeout" }),
        scan("3", { aiStatus: "done" }),
        scan("4", { aiStatus: "consent_required" }),
        scan("5", { status: "RUNNING", aiStatus: null, criticalCount: 0 }),
      ],
    });
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <RepoScanHistory orgId="org_1" repoId="repo_1" slug="acme" />
      </QueryClientProvider>,
    );
    await screen.findByText("#1");

    // Static done, AI still running: not "Done", and criticals may grow.
    expect(rowOf("1")).toHaveTextContent("AI reviewing");
    expect(rowOf("1")).not.toHaveTextContent(/^.*\bDone\b/);
    expect(
      within(rowOf("1")).getByText("1 critical so far"),
    ).toBeInTheDocument();

    const failed = within(rowOf("2")).getByText("Done · AI failed");
    expect(failed).toHaveAttribute(
      "title",
      "AI review failed: provider_timeout",
    );
    expect(rowOf("2")).toHaveTextContent("2 critical found");

    expect(rowOf("3")).toHaveTextContent("Done");
    expect(rowOf("3")).not.toHaveTextContent("static only");

    expect(rowOf("4")).toHaveTextContent("Done");
    expect(rowOf("4")).toHaveTextContent("static only");

    expect(rowOf("5")).toHaveTextContent("Running");
  });
});
