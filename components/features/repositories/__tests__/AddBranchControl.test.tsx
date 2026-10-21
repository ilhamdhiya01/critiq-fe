import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getRepoBranches } from "@/services/repositories.service";

import AddBranchControl from "../RepositoryDetail/AddBranchControl";

vi.mock("@/services/repositories.service", () => ({
  getRepoBranches: vi.fn(),
}));

const branchesResponse = (branches: string[]) => ({
  data: {
    defaultBranch: "main",
    branches,
    total: branches.length,
    truncated: false,
  },
});

const axiosError = (status: number, data: unknown) =>
  new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);

const renderControl = (monitored: string[] = ["main"]) => {
  const onAdd = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AddBranchControl
        orgId="org_1"
        repoId="repo_1"
        provider="GITHUB"
        monitored={monitored}
        onAdd={onAdd}
      />
    </QueryClientProvider>,
  );
  return { onAdd };
};

describe("AddBranchControl", () => {
  beforeEach(() => {
    vi.mocked(getRepoBranches).mockReset();
  });

  it("adds the clicked repo branch", async () => {
    vi.mocked(getRepoBranches).mockResolvedValue(
      branchesResponse(["main", "develop"]),
    );
    const { onAdd } = renderControl();

    fireEvent.click(
      await screen.findByRole("button", { name: "Monitor develop" }),
    );

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith("develop");
  });

  it("never offers a branch that is already monitored", async () => {
    vi.mocked(getRepoBranches).mockResolvedValue(
      branchesResponse(["main", "develop", "staging"]),
    );
    renderControl(["main", "staging"]);

    expect(
      await screen.findByRole("button", { name: "Monitor develop" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Monitor main" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Monitor staging" }),
    ).not.toBeInTheDocument();
  });

  it("offers nothing to add once every branch is monitored", async () => {
    vi.mocked(getRepoBranches).mockResolvedValue(branchesResponse(["main"]));
    renderControl(["main"]);

    expect(
      await screen.findByText(
        "Every branch in this repository is already monitored.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Monitor / }),
    ).not.toBeInTheDocument();
  });

  it("retries a failed branch load", async () => {
    vi.mocked(getRepoBranches)
      .mockRejectedValueOnce(axiosError(502, { message: "bad_gateway" }))
      .mockResolvedValue(branchesResponse(["main", "develop"]));
    renderControl();

    fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("button", { name: "Monitor develop" }),
    ).toBeInTheDocument();
    expect(getRepoBranches).toHaveBeenCalledTimes(2);
  });

  it("points to Integrations instead of retrying when access was removed", async () => {
    vi.mocked(getRepoBranches).mockRejectedValue(
      axiosError(403, { message: "github_uninstalled" }),
    );
    renderControl();

    expect(
      await screen.findByText(/GitHub access was removed/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(getRepoBranches).toHaveBeenCalledTimes(1));
  });
});
