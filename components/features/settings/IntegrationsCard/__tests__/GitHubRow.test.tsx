import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import type {
  Integration,
  IntegrationStatus,
} from "@/lib/types/integration.types";
import { disconnectGitHub } from "@/services/integrations.service";

import GitHubRow from "../GitHubRow";

vi.mock("@/services/integrations.service", () => ({
  disconnectGitHub: vi.fn(),
  installIntentGithub: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const integrationIn = (state: IntegrationStatus | string): Integration =>
  ({
    source: "GITHUB",
    credentialKind: "INSTALLATION",
    state,
    instanceUrl: null,
    tokenKind: null,
    tokenUsername: null,
    tokenLast4: null,
    expiresAt: null,
    groups: null,
    installationId: "1",
    installationLogin: "ilhamdhiya01",
    appSlug: "critiq",
  }) as Integration;

const renderRow = (
  integration: Integration | null,
  isAdmin = true,
  client = new QueryClient(),
) =>
  render(
    <QueryClientProvider client={client}>
      <GitHubRow
        orgId="org_1"
        integration={integration}
        repoCount={2}
        isAdmin={isAdmin}
      />
    </QueryClientProvider>,
  );

describe("GitHubRow", () => {
  beforeEach(() => {
    vi.mocked(disconnectGitHub).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("ACTIVE: connected chip, Connect more, Manage on GitHub and Disconnect", () => {
    renderRow(integrationIn("ACTIVE"));
    expect(screen.getByText("CONNECTED")).toBeInTheDocument();
    expect(screen.getByText("Connect more")).toBeInTheDocument();
    expect(screen.getByText("Manage on GitHub")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeVisible();
  });

  it("UNINSTALLED: warning text, Reinstall + Disconnect, no Connect more / Manage", () => {
    renderRow(integrationIn("UNINSTALLED"));
    expect(screen.getByText("UNINSTALLED ON GITHUB")).toBeInTheDocument();
    expect(
      screen.getByText(/The Critiq app was removed from GitHub/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reinstall" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeVisible();
    expect(screen.queryByText("Connect more")).not.toBeInTheDocument();
    expect(screen.queryByText("Manage on GitHub")).not.toBeInTheDocument();
  });

  it("SUSPENDED: warning text, Manage on GitHub + Disconnect", () => {
    renderRow(integrationIn("SUSPENDED"));
    expect(screen.getByText("SUSPENDED ON GITHUB")).toBeInTheDocument();
    expect(
      screen.getByText(/The Critiq app is suspended on GitHub/),
    ).toBeInTheDocument();
    expect(screen.getByText("Manage on GitHub")).toBeInTheDocument();
    expect(screen.queryByText("Connect more")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeVisible();
  });

  it("PENDING_APPROVAL and unknown states render without crashing", () => {
    const { unmount } = renderRow(integrationIn("PENDING_APPROVAL"));
    expect(screen.getByText("PENDING APPROVAL")).toBeInTheDocument();
    unmount();

    renderRow(integrationIn("SOMETHING_NEW"));
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });

  it("hides Disconnect and Reinstall from non-Admins", () => {
    renderRow(integrationIn("UNINSTALLED"), false);
    expect(screen.getByText("UNINSTALLED ON GITHUB")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("confirms before disconnecting; cancel does not call the API", () => {
    renderRow(integrationIn("ACTIVE"));
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(screen.getByText("Disconnect GitHub?")).toBeInTheDocument();
    expect(screen.getByText("ilhamdhiya01")).toBeInTheDocument();
    expect(screen.getByText(/2 repositories with their pull/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(disconnectGitHub).not.toHaveBeenCalled();
    expect(screen.queryByText("Disconnect GitHub?")).not.toBeInTheDocument();
  });

  it("disconnects once on confirm and refetches", async () => {
    vi.mocked(disconnectGitHub).mockResolvedValue({ data: null });
    const client = new QueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    renderRow(integrationIn("ACTIVE"), true, client);

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    const [, confirm] = screen.getAllByRole("button", { name: "Disconnect" });
    fireEvent.click(confirm);

    await waitFor(() => expect(disconnectGitHub).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["integrations"] }),
    );
    await waitFor(() =>
      expect(screen.queryByText("Disconnect GitHub?")).not.toBeInTheDocument(),
    );
  });

  it("on 502 shows an error toast and keeps the dialog open", async () => {
    vi.mocked(disconnectGitHub).mockRejectedValue(
      new AxiosError("github_unreachable", "ERR", undefined, undefined, {
        status: 502,
        data: { message: "github_unreachable" },
      } as AxiosResponse),
    );
    renderRow(integrationIn("ACTIVE"));

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    const [, confirm] = screen.getAllByRole("button", { name: "Disconnect" });
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't reach GitHub — nothing was removed. Try again.",
      ),
    );
    expect(screen.getByText("Disconnect GitHub?")).toBeInTheDocument();
    expect(screen.getByText("CONNECTED")).toBeInTheDocument();
  });
});
