import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActiveOrgTestProvider from "@/lib/test-utils/ActiveOrgTestProvider";
import type { Role } from "@/lib/types/auth.types";
import type { Integration } from "@/lib/types/integration.types";
import { getIntegrations } from "@/services/integrations.service";
import { getOrgRepositories } from "@/services/repositories.service";

import IntegrationsCard from "../IntegrationsCard";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/acme/settings",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ slug: "acme" }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock("@/services/integrations.service", () => ({
  getIntegrations: vi.fn(),
  getGitLabHealth: vi.fn(),
  disconnectGitHub: vi.fn(),
  disconnectGitlab: vi.fn(),
  installIntentGithub: vi.fn(),
  verifyGitLabToken: vi.fn(),
}));

vi.mock("@/services/repositories.service", () => ({
  getOrgRepositories: vi.fn(),
}));

const GITHUB = {
  source: "GITHUB",
  credentialKind: "INSTALLATION",
  state: "active",
  instanceUrl: null,
  tokenKind: null,
  tokenUsername: null,
  tokenLast4: null,
  expiresAt: null,
  groups: null,
  installationId: "1",
  installationLogin: "acme-gh",
  appSlug: "critiq",
} as unknown as Integration;

const renderCard = (role: Role = "ADMIN", orgId: string | null = "org_1") =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActiveOrgTestProvider orgId={orgId ?? undefined} role={role}>
        <IntegrationsCard orgId={orgId ?? undefined} />
      </ActiveOrgTestProvider>
    </QueryClientProvider>,
  );

describe("IntegrationsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getIntegrations).mockResolvedValue({ data: [GITHUB] });
    vi.mocked(getOrgRepositories).mockResolvedValue({
      data: [
        {
          id: "r1",
          provider: "GITHUB",
          path: "acme/api",
          defaultBranch: "main",
          monitoredBranchCount: 1,
        },
        {
          id: "r2",
          provider: "GITHUB",
          path: "acme/web",
          defaultBranch: "main",
          monitoredBranchCount: 1,
        },
      ],
    });
  });

  it("lists GitHub and GitLab with Admin actions", async () => {
    renderCard();

    // Lower-case states from the BE are normalized.
    expect(await screen.findByText("CONNECTED")).toBeInTheDocument();
    expect(await screen.findByText(/2 repos connected/)).toBeInTheDocument();
    expect(screen.getByText("GitLab")).toBeInTheDocument();
    expect(screen.getByText("GitLab.com or self-hosted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeVisible();
    expect(getIntegrations).toHaveBeenCalledWith("org_1");
    expect(getOrgRepositories).toHaveBeenCalledWith("org_1");
  });

  it.each(["REVIEWER", "VIEWER"] as const)(
    "shows a %s the status without actions",
    async (role) => {
      renderCard(role);

      expect(await screen.findByText("CONNECTED")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    },
  );

  it("shows an error when integrations cannot be loaded", async () => {
    vi.mocked(getIntegrations).mockRejectedValue(new Error("boom"));
    renderCard();

    expect(
      await screen.findByText(
        "Failed to load integrations. Reload the page to try again.",
      ),
    ).toBeInTheDocument();
  });

  it("shows an error without an org and fetches nothing", () => {
    renderCard("ADMIN", null);

    expect(screen.getByText(/Failed to load integrations/)).toBeInTheDocument();
    expect(getIntegrations).not.toHaveBeenCalled();
  });
});
