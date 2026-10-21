import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { installIntentGithub } from "@/services/integrations.service";

import { useInstallGitHubApps } from "../useInstallGitHubApps";

vi.mock("@/services/integrations.service", () => ({
  installIntentGithub: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const INSTALL_URL = "https://github.com/apps/critiq/installations/new";

const setup = (returnTo?: "setup" | "settings") => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useInstallGitHubApps("org_1", returnTo), {
    wrapper,
  });
  return { result };
};

describe("useInstallGitHubApps", () => {
  const assign = vi.fn();

  beforeEach(() => {
    // jsdom's location cannot be navigated; swap it for a stub.
    vi.stubGlobal("location", { ...window.location, assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("sends the browser to GitHub's install page (setup by default)", async () => {
    vi.mocked(installIntentGithub).mockResolvedValue({
      data: { installUrl: INSTALL_URL },
    });
    const { result } = setup();

    await act(() => result.current.handleInstallIntentGitHub());

    expect(installIntentGithub).toHaveBeenCalledWith("org_1", {
      returnTo: "setup",
    });
    expect(assign).toHaveBeenCalledWith(INSTALL_URL);
  });

  it("asks to come back to Settings when started there", async () => {
    vi.mocked(installIntentGithub).mockResolvedValue({
      data: { installUrl: INSTALL_URL },
    });
    const { result } = setup("settings");

    await act(() => result.current.handleInstallIntentGitHub());

    expect(installIntentGithub).toHaveBeenCalledWith("org_1", {
      returnTo: "settings",
    });
  });

  it("stays on the page and toasts when the intent fails", async () => {
    vi.mocked(installIntentGithub).mockRejectedValue(new Error("Forbidden"));
    const { result } = setup();

    await act(() =>
      expect(result.current.handleInstallIntentGitHub()).rejects.toThrow(),
    );

    expect(assign).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Forbidden");
  });
});
