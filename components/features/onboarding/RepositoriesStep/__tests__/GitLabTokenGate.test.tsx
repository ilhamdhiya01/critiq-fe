import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import type { Integration } from "@/lib/types/integration.types";
import { verifyGitLabToken } from "@/services/integrations.service";

import GitLabTokenGate from "../GitLabTokenGate";

vi.mock("@/services/integrations.service", () => ({
  verifyGitLabToken: vi.fn(),
}));

// Same contract as lib/toast's promise(): resolves with the data, or calls
// the error formatter and rethrows.
vi.mock("@/lib/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn(
      async (
        pending: Promise<unknown>,
        messages: {
          success: (data: unknown) => string;
          error: (error: Error) => string;
        },
      ) => {
        try {
          const data = await pending;
          toast.success(messages.success(data));
          return data;
        } catch (error) {
          toast.error(messages.error(error as Error));
          throw error;
        }
      },
    ),
  },
}));

const onVerified = vi.fn();

const renderGate = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <GitLabTokenGate orgId="org_1" onVerified={onVerified} />
    </QueryClientProvider>,
  );

const tokenInput = () => screen.getByPlaceholderText("glpat-••••••••••••••••");
const urlInput = () => screen.getByDisplayValue("https://gitlab.com");
const verifyButton = () =>
  screen.getByRole("button", { name: "Verify & load projects" });

describe("GitLabTokenGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("needs both an instance URL and a token", () => {
    renderGate();

    expect(verifyButton()).toBeDisabled();
    fireEvent.change(tokenInput(), { target: { value: "   " } });
    expect(verifyButton()).toBeDisabled();
    fireEvent.change(tokenInput(), { target: { value: "glpat-1" } });
    expect(verifyButton()).toBeEnabled();
    fireEvent.change(urlInput(), { target: { value: " " } });
    expect(verifyButton()).toBeDisabled();
  });

  it("verifies the trimmed values and continues with the instance URL", async () => {
    vi.mocked(verifyGitLabToken).mockResolvedValue({
      data: { source: "GITLAB" } as Integration,
    });
    renderGate();

    fireEvent.change(urlInput(), {
      target: { value: " https://git.acme.dev " },
    });
    fireEvent.change(tokenInput(), { target: { value: " glpat-1 " } });
    fireEvent.click(verifyButton());

    await waitFor(() =>
      expect(verifyGitLabToken).toHaveBeenCalledWith("org_1", {
        instanceUrl: "https://git.acme.dev",
        token: "glpat-1",
      }),
    );
    await waitFor(() =>
      expect(onVerified).toHaveBeenCalledWith("https://git.acme.dev"),
    );
    expect(toast.success).toHaveBeenCalledWith("GitLab successfully connected");
  });

  it.each([
    ["scope_missing", "Token is missing the required api scope."],
    ["provider_down", "provider_down"],
  ])("explains a %s error and does not continue", async (code, message) => {
    // The axios interceptor puts the BE error code in `message`.
    vi.mocked(verifyGitLabToken).mockRejectedValue(new AxiosError(code));
    renderGate();

    fireEvent.change(tokenInput(), { target: { value: "glpat-1" } });
    fireEvent.click(verifyButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(onVerified).not.toHaveBeenCalled();
    await waitFor(() => expect(verifyButton()).toBeEnabled());
  });
});
