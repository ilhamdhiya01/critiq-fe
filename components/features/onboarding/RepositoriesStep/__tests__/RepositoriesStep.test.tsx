import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Integration } from "@/lib/types/integration.types";
import {
  getIntegrationCandidates,
  getIntegrations,
} from "@/services/integrations.service";

import RepositoriesStep from "../RepositoriesStep";

vi.mock("@/services/integrations.service", () => ({
  getIntegrations: vi.fn(),
  getIntegrationCandidates: vi.fn(),
  installIntentGithub: vi.fn(),
  disconnectGitlab: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const onUseGitLab = vi.fn();
const onSkip = vi.fn();

const renderStep = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RepositoriesStep
        selectedRepos={{}}
        onToggleRepo={vi.fn()}
        selectedBranches={{}}
        onToggleBranch={vi.fn()}
        onBranchesReady={vi.fn()}
        onContinueBlockedChange={vi.fn()}
        organizationId="org_1"
        provider="GITHUB"
        onUseGitLab={onUseGitLab}
        onSkip={onSkip}
      />
    </QueryClientProvider>,
  );

describe("RepositoriesStep (GitHub pending owner approval)", () => {
  beforeEach(() => {
    onUseGitLab.mockReset();
    onSkip.mockReset();
    vi.mocked(getIntegrationCandidates).mockReset();
    vi.mocked(getIntegrations).mockResolvedValue({
      data: [{ source: "GITHUB", state: "PENDING_APPROVAL" } as Integration],
    });
  });

  it("explains the wait instead of the repository picker", async () => {
    renderStep();

    expect(
      await screen.findByText(
        /A GitHub organization owner must approve the installation request/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Waiting for owner approval")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect GitHub" }),
    ).toBeInTheDocument();
    // No installation yet: the candidates list is never requested.
    expect(getIntegrationCandidates).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Install Critiq on GitHub" }),
    ).not.toBeInTheDocument();
  });

  it("offers GitLab instead, or skipping for now", async () => {
    renderStep();

    fireEvent.click(
      await screen.findByRole("button", { name: "Use GitLab instead" }),
    );
    expect(onUseGitLab).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("loads repositories as usual once GitHub is active", async () => {
    vi.mocked(getIntegrations).mockResolvedValue({
      data: [{ source: "GITHUB", state: "ACTIVE" } as Integration],
    });
    vi.mocked(getIntegrationCandidates).mockResolvedValue({
      data: [],
    } as never);
    renderStep();

    await vi.waitFor(() => expect(getIntegrationCandidates).toHaveBeenCalled());
    expect(
      screen.queryByText("Waiting for owner approval"),
    ).not.toBeInTheDocument();
  });
});
