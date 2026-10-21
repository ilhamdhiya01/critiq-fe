import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GITHUB_ACCESS_REMOVED_MESSAGE } from "@/const/integration.constant";
import {
  CONNECT_REPOS_FORBIDDEN_MESSAGE,
  WEBHOOK_FAILED_MESSAGE,
} from "@/const/repository.constant";
import { integrationKeys } from "@/lib/hooks/integrations/queryKeys";
import { toast } from "@/lib/toast";
import type { IntegrationProvider } from "@/lib/types/integration.types";
import type { ConnectRepositoryItem } from "@/lib/types/repository.types";
import {
  connectRepositories,
  getIntegrationCandidates,
  getIntegrationRepoBranches,
} from "@/services/integrations.service";
import { getOrgRepositories } from "@/services/repositories.service";

import ConnectRepositoriesModal from "../ConnectRepositoriesModal";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/services/integrations.service", () => ({
  getIntegrationCandidates: vi.fn(),
  getIntegrationRepoBranches: vi.fn(),
  connectRepositories: vi.fn(),
}));

vi.mock("@/services/repositories.service", () => ({
  getOrgRepositories: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

const CANDIDATES = [
  { id: 101, path: "acme/api", lang: "Go", private: true },
  { id: 102, path: "acme/web", lang: "TypeScript", private: false },
  { id: 103, path: "acme/legacy", lang: null, private: false },
];

const BRANCHES = {
  data: {
    defaultBranch: "main",
    branches: ["main", "dev"],
    total: 2,
    truncated: false,
  },
};

const apiError = (status: number, code?: string) => ({
  message: `Request failed with status code ${status}`,
  response: {
    status,
    data: code ? { errors: [{ field: "source", message: code }] } : {},
  },
});

const okItem = (
  path: string,
  webhook: "installed" | "failed" = "installed",
): ConnectRepositoryItem => ({
  status: "ok",
  repoId: `repo_${path}`,
  path,
  defaultBranch: "main",
  monitoredBranches: ["main"],
  webhook: { status: webhook },
});

const renderModal = (provider: IntegrationProvider = "GITHUB") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ConnectRepositoriesModal
        orgId="org_1"
        provider={provider}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
  return { onClose, invalidateSpy };
};

const submitButton = () => screen.getByRole("button", { name: /^Connect/ });

// A candidate's whole row (path, checkbox, branch picker, row error).
const rowOf = (path: string) =>
  screen.getByText(path).closest<HTMLElement>(".border-border-row")!;

// Picks a repo and waits until its default branch is preselected.
const pickRepo = async (path: string) => {
  fireEvent.click(await screen.findByText(path));
  await within(rowOf(path)).findByText(/1 of 2/);
  // Submitting is blocked until every picked repo has its branches.
  await waitFor(() => expect(submitButton()).toBeEnabled());
};

// Real query + mutation hooks over mocked services; slow under coverage.
describe("ConnectRepositoriesModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getIntegrationCandidates).mockResolvedValue({
      data: CANDIDATES,
    });
    vi.mocked(getOrgRepositories).mockResolvedValue({
      data: [
        {
          id: "repo_legacy",
          provider: "GITHUB",
          path: "acme/legacy",
          defaultBranch: "main",
          monitoredBranchCount: 1,
        },
      ],
    });
    vi.mocked(getIntegrationRepoBranches).mockResolvedValue(BRANCHES);
  });

  it("sends the picked repos, default branch and chosen policy, then closes", async () => {
    vi.mocked(connectRepositories).mockResolvedValue({
      data: { items: [okItem("acme/api")] },
    });
    const { onClose } = renderModal();

    await pickRepo("acme/api");
    fireEvent.click(screen.getByRole("button", { name: /Require both/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Connect 1 repository" }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(connectRepositories).toHaveBeenCalledWith("org_1", {
      source: "github",
      projects: [{ id: "101", monitoredBranches: ["main"] }],
      defaultPolicy: "require_both",
    });
    expect(toast.success).toHaveBeenCalledWith("1 repository connected");
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("uses the gitlab source and the default policy for GitLab", async () => {
    vi.mocked(connectRepositories).mockResolvedValue({
      data: { items: [okItem("acme/api")] },
    });
    const { onClose } = renderModal("GITLAB");

    await pickRepo("acme/api");
    fireEvent.click(
      screen.getByRole("button", { name: "Connect 1 repository" }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(getIntegrationCandidates).toHaveBeenCalledWith("org_1", "gitlab");
    expect(connectRepositories).toHaveBeenCalledWith(
      "org_1",
      expect.objectContaining({ source: "gitlab", defaultPolicy: "allow_ai" }),
    );
  });

  it("warns about repos connected without a webhook", async () => {
    vi.mocked(connectRepositories).mockResolvedValue({
      data: { items: [okItem("acme/api", "failed")] },
    });
    const { onClose } = renderModal();

    await pickRepo("acme/api");
    fireEvent.click(
      screen.getByRole("button", { name: "Connect 1 repository" }),
    );

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast.warning).toHaveBeenCalledWith("acme/api", {
      description: WEBHOOK_FAILED_MESSAGE,
    });
  });

  it("stays open on a partial failure: drops connected repos and shows row errors", async () => {
    vi.mocked(connectRepositories).mockResolvedValue({
      data: {
        items: [
          okItem("acme/api"),
          {
            status: "failed",
            providerRepoId: 102,
            error: "unknown_branch",
            branch: "main",
          },
        ],
      },
    });
    const { onClose } = renderModal();

    await pickRepo("acme/api");
    await pickRepo("acme/web");
    fireEvent.click(
      screen.getByRole("button", { name: "Connect 2 repositories" }),
    );

    expect(await screen.findByText("Branch main not found")).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    // Only the failed repo is still picked, ready for a retry.
    expect(submitButton()).toHaveTextContent("Connect 1 repository");

    // Touching the failed row clears its error.
    fireEvent.click(screen.getByText("acme/web"));
    expect(screen.queryByText("Branch main not found")).not.toBeInTheDocument();
  });

  it("stays open when the request fails", async () => {
    vi.mocked(connectRepositories).mockRejectedValue(apiError(403));
    const { onClose } = renderModal();

    await pickRepo("acme/api");
    fireEvent.click(
      screen.getByRole("button", { name: "Connect 1 repository" }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(CONNECT_REPOS_FORBIDDEN_MESSAGE),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("cannot submit with nothing picked or while branches fail to load", async () => {
    vi.mocked(getIntegrationRepoBranches).mockRejectedValue(apiError(500));
    renderModal();

    await screen.findByText("acme/api");
    expect(submitButton()).toBeDisabled();

    fireEvent.click(screen.getByText("acme/api"));
    expect(await screen.findByText(/Failed to load branches/)).toBeVisible();
    expect(submitButton()).toHaveTextContent("Connect 1 repository");
    expect(submitButton()).toBeDisabled();
  });

  it("never lets an already connected repo be picked again", async () => {
    renderModal();

    fireEvent.click(await screen.findByText("acme/legacy"));
    const row = rowOf("acme/legacy");

    expect(within(row).getByRole("checkbox")).toBeDisabled();
    expect(within(row).getByRole("checkbox")).not.toBeChecked();
    expect(
      within(row).getByRole("link", { name: "Edit settings" }),
    ).toHaveAttribute("href", "/acme/repositories/repo_legacy");
    expect(submitButton()).toBeDisabled();
  });

  it("closes and refreshes integrations when the provider is no longer connected", async () => {
    vi.mocked(getIntegrationCandidates).mockRejectedValue(
      apiError(400, "github_not_connected"),
    );
    const { onClose, invalidateSpy } = renderModal();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: integrationKeys.list("org_1"),
    });
  });

  it("explains removed GitHub access and refreshes integrations", async () => {
    vi.mocked(getIntegrationCandidates).mockRejectedValue(
      apiError(409, "github_uninstalled"),
    );
    const { onClose, invalidateSpy } = renderModal();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      GITHUB_ACCESS_REMOVED_MESSAGE,
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: integrationKeys.list("org_1"),
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("tells non-Admins they cannot connect, without a retry", async () => {
    vi.mocked(getIntegrationCandidates).mockRejectedValue(apiError(403));
    renderModal();

    expect(
      await screen.findByText(CONNECT_REPOS_FORBIDDEN_MESSAGE),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
  });

  it("retries a generic candidates failure", async () => {
    vi.mocked(getIntegrationCandidates).mockRejectedValueOnce(apiError(500));
    renderModal();

    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));

    expect(await screen.findByText("acme/api")).toBeInTheDocument();
    expect(getIntegrationCandidates).toHaveBeenCalledTimes(2);
  });

  it("closes from Cancel without connecting", async () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(connectRepositories).not.toHaveBeenCalled();
  });
});
