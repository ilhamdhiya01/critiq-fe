import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScanConfig } from "@/lib/types/repository.types";
import {
  getRepoBranches,
  updateScanConfig,
} from "@/services/repositories.service";

import BranchPolicyTable from "../RepositoryDetail/BranchPolicyTable";

vi.mock("@/services/repositories.service", () => ({
  updateScanConfig: vi.fn(),
  getRepoBranches: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const CONFIG: ScanConfig = {
  defaultBranch: "main",
  branches: ["main", "develop"],
  policies: [
    { branch: "main", policy: "require_both" },
    { branch: "develop", policy: "allow_ai" },
  ],
  missing: [],
  missingCheckStatus: "not_available",
  defaultBranchChangedAt: null,
};

const REPO_BRANCHES = [
  "main",
  "develop",
  "staging",
  "release/1.4",
  "release/1.5",
];

const axiosError = (status: number, data: unknown) =>
  new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);

const renderTable = (config: ScanConfig, isAdmin: boolean) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <BranchPolicyTable
        orgId="org_1"
        repoId="repo_1"
        provider="GITHUB"
        config={config}
        isAdmin={isAdmin}
      />
    </QueryClientProvider>,
  );

const policyGroup = (label: string) =>
  within(screen.getByRole("radiogroup", { name: label }));

// First render in a cold worker can exceed the 5s default under load.
describe("BranchPolicyTable", { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(updateScanConfig).mockReset();
    vi.mocked(getRepoBranches).mockReset();
    vi.mocked(getRepoBranches).mockResolvedValue({
      data: {
        defaultBranch: "main",
        branches: REPO_BRANCHES,
        total: REPO_BRANCHES.length,
        truncated: false,
      },
    });
  });

  it("shows each branch's policy and the default branch cannot be removed", () => {
    renderTable(CONFIG, true);

    expect(
      policyGroup("Review policy for main").getByRole("radio", {
        name: "Require both",
      }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      policyGroup("Review policy for develop").getByRole("radio", {
        name: "Allow AI",
      }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("default")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Stop monitoring main" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Branches must already exist in the repository/),
    ).toBeVisible();
    expect(screen.getByText("Final approval is always manual.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("has no free-text add or search — only From repo chips", async () => {
    renderTable(CONFIG, true);

    expect(await screen.findByText("From repo:")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Add Branch/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(getRepoBranches).toHaveBeenCalledWith(
      "org_1",
      "repo_1",
      expect.objectContaining({ search: "" }),
    );
  });

  it("offers repo branches minus the monitored ones and adds with the default branch's policy", async () => {
    renderTable(CONFIG, true);

    fireEvent.click(
      await screen.findByRole("button", { name: "Monitor staging" }),
    );
    expect(
      screen.getByRole("button", { name: "Monitor release/1.5" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Monitor main" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Monitor develop" }),
    ).not.toBeInTheDocument();

    expect(
      policyGroup("Review policy for staging").getByRole("radio", {
        name: "Require both",
      }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.queryByRole("button", { name: "Monitor staging" }),
    ).not.toBeInTheDocument();
  });

  it("says so when every repo branch is already monitored", async () => {
    vi.mocked(getRepoBranches).mockResolvedValue({
      data: {
        defaultBranch: "main",
        branches: ["main", "develop"],
        total: 2,
        truncated: false,
      },
    });
    renderTable(CONFIG, true);

    expect(
      await screen.findByText(
        "Every branch in this repository is already monitored.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Monitor / }),
    ).not.toBeInTheDocument();
  });

  it("notes when the branch list is truncated", async () => {
    vi.mocked(getRepoBranches).mockResolvedValue({
      data: {
        defaultBranch: "main",
        branches: REPO_BRANCHES,
        total: 50,
        truncated: true,
      },
    });
    renderTable(CONFIG, true);

    expect(
      await screen.findByText(
        "Showing the first 50 branches of this repository.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a retryable error when branches fail to load", async () => {
    vi.mocked(getRepoBranches).mockRejectedValue(axiosError(502, {}));
    renderTable(CONFIG, true);

    expect(
      await screen.findByText(/Couldn't load branches from GitHub\./),
    ).toBeInTheDocument();

    vi.mocked(getRepoBranches).mockResolvedValue({
      data: {
        defaultBranch: "main",
        branches: REPO_BRANCHES,
        total: 5,
        truncated: false,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("button", { name: "Monitor staging" }),
    ).toBeInTheDocument();
  });

  it("applies one policy to all rows and saves branches + policies once", async () => {
    vi.mocked(updateScanConfig).mockResolvedValue({ data: CONFIG });
    renderTable(CONFIG, true);

    fireEvent.click(
      policyGroup("Apply a review policy to all branches").getByRole("radio", {
        name: "Manual only",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(updateScanConfig).toHaveBeenCalledTimes(1));
    expect(updateScanConfig).toHaveBeenCalledWith("org_1", "repo_1", {
      branches: ["main", "develop"],
      policies: [
        { branch: "main", policy: "manual_only" },
        { branch: "develop", policy: "manual_only" },
      ],
    });
  });

  it("puts 422 unknown_branch on that branch's row and lets the user remove it", async () => {
    vi.mocked(updateScanConfig).mockRejectedValueOnce(
      axiosError(422, {
        errors: [
          { field: "branches", message: "unknown_branch", branch: "staging" },
        ],
      }),
    );
    renderTable(CONFIG, true);

    fireEvent.click(
      await screen.findByRole("button", { name: "Monitor staging" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(
        "This branch no longer exists in the repository.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Stop monitoring staging" }),
    );
    expect(
      screen.queryByText("This branch no longer exists in the repository."),
    ).not.toBeInTheDocument();
  });

  it("points Admins to Integrations when the provider is unreachable on save", async () => {
    vi.mocked(updateScanConfig).mockRejectedValue(
      axiosError(409, {
        errors: [{ field: "integration", message: "github_uninstalled" }],
      }),
    );
    renderTable(CONFIG, true);

    fireEvent.click(
      await screen.findByRole("button", { name: "Monitor staging" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Settings → Integrations",
    );
  });

  it("is read-only for Reviewers and Viewers — no picker", () => {
    renderTable(CONFIG, false);

    expect(screen.getByText("Require both")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByText("From repo:")).not.toBeInTheDocument();
    expect(getRepoBranches).not.toHaveBeenCalled();
  });

  it("shows 422 policy errors on the row and above the table", async () => {
    vi.mocked(updateScanConfig).mockRejectedValue(
      axiosError(422, {
        errors: [
          {
            field: "policies[1].branch",
            message: "policy_branch_not_in_scope",
          },
          { field: "policies", message: "duplicate_policy_branch" },
        ],
      }),
    );
    renderTable(CONFIG, true);

    fireEvent.click(
      policyGroup("Review policy for develop").getByRole("radio", {
        name: "Manual only",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(
        "A policy was set for a branch that is not monitored.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This branch has more than one policy.",
    );
  });

  it("hides the policy column when the BE does not send policies", () => {
    renderTable({ ...CONFIG, policies: undefined }, true);

    expect(screen.getByText("Monitored branches")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.getByText("develop")).toBeInTheDocument();
  });
});
