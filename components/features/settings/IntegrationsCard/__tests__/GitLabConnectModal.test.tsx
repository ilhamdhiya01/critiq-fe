import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import type { Integration } from "@/lib/types/integration.types";
import { verifyGitLabToken } from "@/services/integrations.service";

import GitLabConnectModal from "../GitLabConnectModal";

vi.mock("@/services/integrations.service", () => ({
  verifyGitLabToken: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const onClose = vi.fn();

const axiosError = (
  status: number,
  errors: { field: string; message: string }[],
  message = errors[0]?.message ?? "ERR",
) =>
  new AxiosError(message, "ERR", undefined, undefined, {
    status,
    data: { errors },
  } as AxiosResponse);

const renderModal = (isReplace = false) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <GitLabConnectModal
        orgId="org_1"
        isReplace={isReplace}
        initialInstanceUrl="https://gitlab.com"
        onClose={onClose}
      />
    </QueryClientProvider>,
  );

const tokenInput = () => screen.getByPlaceholderText("glpat-••••••••••••••••");
const urlInput = () => screen.getByPlaceholderText("https://gitlab.com");

describe("GitLabConnectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("needs a token before Connect is enabled", () => {
    renderModal();

    expect(screen.getByText("Connect GitLab")).toBeInTheDocument();
    expect(urlInput()).toHaveValue("https://gitlab.com");
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();

    fireEvent.change(tokenInput(), { target: { value: "glpat-123" } });
    expect(screen.getByRole("button", { name: "Connect" })).toBeEnabled();

    fireEvent.change(urlInput(), { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
  });

  it("verifies the token, toasts and closes", async () => {
    vi.mocked(verifyGitLabToken).mockResolvedValue({
      data: { source: "GITLAB", state: "ACTIVE" } as Integration,
    });
    renderModal();

    fireEvent.change(urlInput(), {
      target: { value: " https://git.acme.dev " },
    });
    fireEvent.change(tokenInput(), { target: { value: "glpat-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() =>
      expect(verifyGitLabToken).toHaveBeenCalledWith("org_1", {
        instanceUrl: "https://git.acme.dev",
        token: "glpat-123",
      }),
    );
    // The token is cleared from state as soon as it is sent.
    expect(tokenInput()).toHaveValue("");
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith("GitLab connected");
  });

  it("shows field errors and stays open", async () => {
    vi.mocked(verifyGitLabToken).mockRejectedValue(
      axiosError(422, [{ field: "token", message: "scope_missing" }]),
    );
    renderModal();

    fireEvent.change(tokenInput(), { target: { value: "glpat-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(
      await screen.findByText("Token needs the api scope."),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    // Editing the field clears the error.
    fireEvent.change(tokenInput(), { target: { value: "glpat-456" } });
    expect(
      screen.queryByText("Token needs the api scope."),
    ).not.toBeInTheDocument();
  });

  it("shows an instance URL error under the URL field", async () => {
    vi.mocked(verifyGitLabToken).mockRejectedValue(
      axiosError(422, [
        { field: "instance_url", message: "instance_unreachable" },
      ]),
    );
    renderModal();

    fireEvent.change(tokenInput(), { target: { value: "glpat-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(
      await screen.findByText("GitLab instance unreachable — check the URL."),
    ).toBeInTheDocument();
    fireEvent.change(urlInput(), { target: { value: "https://gitlab.com/" } });
    expect(
      screen.queryByText("GitLab instance unreachable — check the URL."),
    ).not.toBeInTheDocument();
  });

  it("toasts errors that have no field", async () => {
    vi.mocked(verifyGitLabToken).mockRejectedValue(axiosError(403, [], "nope"));
    renderModal();

    fireEvent.change(tokenInput(), { target: { value: "glpat-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Only Admins can change integrations.",
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("uses replace wording and closes on Escape", () => {
    renderModal(true);

    expect(screen.getByText("Replace GitLab token")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Replace token" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
