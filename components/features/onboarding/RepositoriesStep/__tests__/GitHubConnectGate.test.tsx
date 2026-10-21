import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { installIntentGithub } from "@/services/integrations.service";

import GitHubConnectGate from "../GitHubConnectGate";

vi.mock("@/services/integrations.service", () => ({
  installIntentGithub: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const renderGate = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <GitHubConnectGate orgId="org_1" />
    </QueryClientProvider>,
  );

describe("GitHubConnectGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.location.hash = "";
  });

  it("asks for an install URL returning to setup, then redirects to it", async () => {
    // A same-document URL, since jsdom cannot navigate to another page.
    const installUrl = `${window.location.origin}${window.location.pathname}#github-install`;
    vi.mocked(installIntentGithub).mockResolvedValue({
      data: { installUrl },
    } as never);
    renderGate();

    fireEvent.click(
      screen.getByRole("button", { name: "Install Critiq on GitHub" }),
    );

    await waitFor(() =>
      expect(installIntentGithub).toHaveBeenCalledWith("org_1", {
        returnTo: "setup",
      }),
    );
    await waitFor(() => expect(window.location.hash).toBe("#github-install"));
    // Stays locked until the browser leaves the page.
    expect(
      await screen.findByRole("button", { name: /Redirect to GitHub/ }),
    ).toBeDisabled();
  });

  it("toasts a failed install request and lets the user retry", async () => {
    vi.mocked(installIntentGithub).mockRejectedValue(new Error("forbidden"));
    renderGate();

    fireEvent.click(
      screen.getByRole("button", { name: "Install Critiq on GitHub" }),
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("forbidden"));
    expect(
      await screen.findByRole("button", { name: "Install Critiq on GitHub" }),
    ).toBeEnabled();
  });
});
