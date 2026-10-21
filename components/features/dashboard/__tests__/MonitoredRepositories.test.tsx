import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActiveOrgTestProvider from "@/lib/test-utils/ActiveOrgTestProvider";
import type { OrgRepository } from "@/lib/types/repository.types";
import { getOrgRepositories } from "@/services/repositories.service";

import MonitoredRepositories from "../MonitoredRepositories";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/services/repositories.service", () => ({
  getOrgRepositories: vi.fn(),
}));

const REPO = (id: string, path: string): OrgRepository => ({
  id,
  provider: "GITHUB",
  path,
  defaultBranch: "main",
  monitoredBranchCount: 1,
  openCriticalCount: 0,
  lastScanAt: null,
});

const renderWidget = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActiveOrgTestProvider orgId="org_1" role="VIEWER">
        <MonitoredRepositories />
      </ActiveOrgTestProvider>
    </QueryClientProvider>,
  );

describe("MonitoredRepositories", () => {
  beforeEach(() => {
    mockPush.mockReset();
    vi.mocked(getOrgRepositories).mockReset();
  });

  it("opens the clicked repository in the active org", async () => {
    vi.mocked(getOrgRepositories).mockResolvedValue({
      data: [
        REPO("repo_1", "acme/payments-api"),
        REPO("repo_2", "acme/web-app"),
      ],
    });
    renderWidget();

    fireEvent.click(
      (await screen.findByText("web-app")).closest("tr") as HTMLElement,
    );

    expect(getOrgRepositories).toHaveBeenCalledWith("org_1");
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/acme/repositories/repo_2");
  });

  it("has nothing to open without repositories", async () => {
    vi.mocked(getOrgRepositories).mockResolvedValue({ data: [] });
    renderWidget();

    fireEvent.click(await screen.findByText("No repositories connected yet"));

    expect(mockPush).not.toHaveBeenCalled();
  });
});
