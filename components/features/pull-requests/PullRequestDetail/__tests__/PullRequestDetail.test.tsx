import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  Finding,
  PullRequestDetail as PullRequestDetailData,
} from "@/lib/types/pull-request.types";

import PullRequestDetail from "../PullRequestDetail";

// A response from an older BE that still carries the removed quality gate.
const DETAIL = {
  id: "pr_1",
  repositoryId: "repo_1",
  repositoryPath: "acme/critiq-core",
  provider: "GITHUB",
  externalId: "2",
  title: "Fix decorator syntax for Injectable",
  authorUsername: "ilhamdhiya01",
  sourceBranch: "fit",
  targetBranch: "dev",
  state: "OPEN",
  criticalCount: 1,
  effectivePolicy: "ALLOW_AI",
  createdAt: "2026-10-12T01:00:00Z",
  updatedAt: "2026-10-12T02:00:00Z",
  headSha: "abc",
  latestScan: {
    criticalCount: 1,
    filesChanged: 1,
    findings: [],
    findingsTruncated: false,
    uncheckedTiers: [],
    aiStatus: "done",
  },
  qualityGate: {
    status: "failed",
    reasons: ["ci_failed"],
    ci: "failure",
    ciChecked: true,
    uncheckedTiers: [],
  },
} as unknown as PullRequestDetailData;

const FINDING = (overrides: Partial<Finding>): Finding => ({
  id: "f1",
  source: "STATIC",
  ruleId: "syntax",
  severity: "CRITICAL",
  title: "Syntax error",
  message: "This change leaves the file unparseable.",
  filePath: "eslint.config.mjs",
  lineStart: 18,
  lineEnd: 18,
  snippet: null,
  ...overrides,
});

let currentDetail: PullRequestDetailData = DETAIL;

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/hooks/organisation/useOrgBySlug", () => ({
  useOrgBySlug: () => ({ membership: { role: "ADMIN" } }),
}));

vi.mock("@/lib/hooks/pull-requests/usePullRequestDetail", () => ({
  usePullRequestDetail: () => ({
    data: currentDetail,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/lib/hooks/pull-requests/usePullRequestDetailDiff", () => ({
  usePullRequestDetailDiff: () => ({
    data: { files: [] },
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/lib/hooks/pull-requests/usePullRequestSummary", () => ({
  usePullRequestSummary: () => ({ data: undefined, isLoading: false }),
}));

const renderDetail = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PullRequestDetail orgId="org_1" repoId="repo_1" id="pr_1" />
    </QueryClientProvider>,
  );

describe("PullRequestDetail", { timeout: 15_000 }, () => {
  beforeEach(() => {
    currentDetail = DETAIL;
  });

  it("shows the same flagged issues — static and AI — in both tabs", () => {
    currentDetail = {
      ...DETAIL,
      effectivePolicy: "REQUIRE_BOTH",
      latestScan: {
        ...DETAIL.latestScan,
        criticalCount: 2,
        findings: [
          FINDING({ id: "f1", source: "STATIC", title: "Syntax error" }),
          FINDING({
            id: "f2",
            source: "AI",
            title: "Unchecked null in handler",
            lineStart: 30,
          }),
        ],
      },
    } as PullRequestDetailData;
    renderDetail();

    expect(screen.getByText("Flagged Issues")).toBeInTheDocument();
    expect(screen.getByText("Syntax error")).toBeInTheDocument();
    expect(screen.getByText("Unchecked null in handler")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Manual Review" }));

    expect(screen.getByText(/the AI summary is hidden/)).toBeInTheDocument();
    expect(screen.getByText("Syntax error")).toBeInTheDocument();
    expect(screen.getByText("Unchecked null in handler")).toBeInTheDocument();
  });

  it("never renders the removed quality gate, even if an older BE sends it", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PullRequestDetail orgId="org_1" repoId="repo_1" id="pr_1" />
      </QueryClientProvider>,
    );

    // Also in the (hidden) sticky bar.
    expect(
      screen.getAllByText(/Fix decorator syntax for Injectable/)[0],
    ).toBeInTheDocument();
    for (const text of [
      "Quality gate",
      "Lolos",
      "Gagal",
      "Menunggu",
      "Lihat quality profile",
    ]) {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/CI:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CI gagal/)).not.toBeInTheDocument();
  });
});
