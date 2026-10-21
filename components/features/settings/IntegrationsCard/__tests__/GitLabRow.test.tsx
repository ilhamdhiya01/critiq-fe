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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import type { Integration } from "@/lib/types/integration.types";
import {
  disconnectGitlab,
  getGitLabHealth,
} from "@/services/integrations.service";

import GitLabRow from "../GitLabRow";

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/services/integrations.service", () => ({
  getGitLabHealth: vi.fn(),
  disconnectGitlab: vi.fn(),
  verifyGitLabToken: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const NOW = new Date("2026-10-21T00:00:00Z");

const gitlab = (overrides: Partial<Integration> = {}): Integration => ({
  source: "GITLAB",
  credentialKind: "GROUP_TOKEN",
  state: "ACTIVE",
  instanceUrl: "https://git.acme.dev",
  tokenKind: "GROUP",
  tokenUsername: "critiq-bot",
  tokenLast4: "9f3a",
  expiresAt: "2026-12-20T00:00:00Z",
  groups: null,
  installationId: null,
  installationLogin: null,
  appSlug: null,
  ...overrides,
});

const axiosError = (status: number, message: string) =>
  new AxiosError(message, "ERR", undefined, undefined, {
    status,
    data: { message },
  } as AxiosResponse);

const renderRow = (
  integration: Integration | null,
  { isAdmin = true, repoCount = 3 as number | undefined } = {},
) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <GitLabRow
        orgId="org_1"
        integration={integration}
        repoCount={repoCount}
        isAdmin={isAdmin}
      />
    </QueryClientProvider>,
  );

describe("GitLabRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("offers Connect to an Admin when GitLab is not connected", () => {
    renderRow(null);

    expect(screen.getByText("GitLab.com or self-hosted")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Connect GitLab");
    expect(screen.getByPlaceholderText("https://gitlab.com")).toHaveValue(
      "https://gitlab.com",
    );
  });

  it("hides Connect from non-Admins", () => {
    renderRow(null, { isAdmin: false });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the connected token, expiry and repo count", () => {
    renderRow(gitlab());

    expect(screen.getByText("CONNECTED")).toBeInTheDocument();
    expect(screen.getByText(/git\.acme\.dev · critiq-bot/)).toBeInTheDocument();
    expect(screen.getByText("Group token")).toBeInTheDocument();
    expect(
      screen.getByText(
        /••••9f3a · expires .* \(60 days left\) · 3 repos connected/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Webhooks managed automatically"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect more" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Replace token" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Check connection" }),
    ).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("asks an Admin to connect repositories when none are", () => {
    renderRow(gitlab(), { repoCount: 0 });

    expect(screen.getByText(/No repositories connected yet/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Connect repositories" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Connect more" }),
    ).not.toBeInTheDocument();
  });

  it("shows a non-Admin the status only", () => {
    renderRow(gitlab(), { isAdmin: false, repoCount: 0 });

    expect(screen.getByText("CONNECTED")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/No repositories connected yet/),
    ).not.toBeInTheDocument();
  });

  it("opens the replace dialog with the current instance URL", () => {
    renderRow(gitlab());

    fireEvent.click(screen.getByRole("button", { name: "Replace token" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Replace GitLab token");
    expect(
      within(dialog).getByPlaceholderText("https://gitlab.com"),
    ).toHaveValue("https://git.acme.dev");
  });

  it("checks the connection and reports a healthy token", async () => {
    vi.mocked(getGitLabHealth).mockResolvedValue({ data: gitlab() });
    renderRow(gitlab());

    fireEvent.click(screen.getByRole("button", { name: "Check connection" }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "GitLab connection is healthy",
      ),
    );
    expect(getGitLabHealth).toHaveBeenCalledWith("org_1");
  });

  it("warns when the health check finds a problem", async () => {
    vi.mocked(getGitLabHealth).mockResolvedValue({
      data: gitlab({ state: "INVALID" }),
    });
    renderRow(gitlab());

    fireEvent.click(screen.getByRole("button", { name: "Check connection" }));

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        "GitLab connection needs attention",
      ),
    );
  });

  it("tells the Admin when GitLab is no longer connected", async () => {
    vi.mocked(getGitLabHealth).mockRejectedValue(
      axiosError(404, "gitlab_not_connected"),
    );
    renderRow(gitlab());

    fireEvent.click(screen.getByRole("button", { name: "Check connection" }));

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith("GitLab is no longer connected"),
    );
  });

  it("toasts a failed health check", async () => {
    vi.mocked(getGitLabHealth).mockRejectedValue(
      axiosError(502, "provider_unreachable"),
    );
    renderRow(gitlab());

    fireEvent.click(screen.getByRole("button", { name: "Check connection" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "GitLab is not responding, try again later.",
      ),
    );
  });

  it("confirms before disconnecting; Cancel keeps it", () => {
    renderRow(gitlab());

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Disconnect GitLab");
    expect(dialog).toHaveTextContent(/Webhooks on every GitLab repo/);

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(disconnectGitlab).not.toHaveBeenCalled();
  });

  it("disconnects on confirm and closes the dialog", async () => {
    vi.mocked(disconnectGitlab).mockResolvedValue({ data: null } as never);
    renderRow(gitlab());

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Disconnect",
      }),
    );

    await waitFor(() => expect(disconnectGitlab).toHaveBeenCalledWith("org_1"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("toasts a failed disconnect and closes the dialog", async () => {
    vi.mocked(disconnectGitlab).mockRejectedValue(axiosError(403, "forbidden"));
    renderRow(gitlab());

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Disconnect",
      }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Only Admins can change integrations.",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
