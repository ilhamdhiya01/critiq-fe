import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GITHUB_ACCESS_REMOVED_MESSAGE } from "@/const/integration.constant";
import {
  CONNECT_REPOS_FORBIDDEN_MESSAGE,
  DEFAULT_BRANCH_POLICY,
} from "@/const/repository.constant";
import { toast } from "@/lib/toast";
import type { ConnectRepositoryResult } from "@/lib/types/repository.types";
import { connectRepositories } from "@/services/integrations.service";

import { useConnectRepositories } from "../useConnectRepositories";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/services/integrations.service", () => ({
  connectRepositories: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

type Item = ConnectRepositoryResult["items"][number];
const OK = { status: "ok" } as Item;
const FAILED = {
  status: "failed",
  providerRepoId: 1,
  error: "provider_unreachable",
} as Item;

const INPUT = {
  source: "github" as const,
  projects: [],
  defaultPolicy: DEFAULT_BRANCH_POLICY,
};

const axiosError = (status: number, message: string) =>
  new AxiosError("Request failed", String(status), undefined, undefined, {
    status,
    data: { message, errors: [{ field: "", message }] },
  } as AxiosResponse);

const setup = (redirectSlug?: string) => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const refetch = vi.spyOn(client, "refetchQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => useConnectRepositories("org_1", { redirectSlug }),
    { wrapper },
  );
  const connect = () =>
    act(() => result.current.handleConnectRepositories(INPUT));
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { connect, refetch, invalidatedKeys };
};

describe("useConnectRepositories (onboarding redirect and errors)", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.mocked(connectRepositories).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.warning).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("refreshes memberships before opening the new org's dashboard", async () => {
    vi.mocked(connectRepositories).mockResolvedValue({ data: { items: [OK] } });
    const { connect, refetch, invalidatedKeys } = setup("acme");
    let releaseRefetch = () => {};
    refetch.mockImplementation(
      () => new Promise<void>((resolve) => (releaseRefetch = resolve)),
    );

    const pending = connect();
    await vi.waitFor(() => expect(refetch).toHaveBeenCalled());

    // Not before memberships are fresh, or the org bounces back to setup.
    expect(replace).not.toHaveBeenCalled();
    expect(refetch).toHaveBeenCalledWith({ queryKey: ["memberships"] });
    expect(invalidatedKeys()).toContainEqual(["user"]);

    releaseRefetch();
    await pending;
    expect(replace).toHaveBeenCalledWith("/acme");
    expect(toast.success).toHaveBeenCalledWith("All repositories connected");
  });

  it("still opens the dashboard on a partial success, with a warning", async () => {
    vi.mocked(connectRepositories).mockResolvedValue({
      data: { items: [OK, FAILED] },
    });
    const { connect } = setup("acme");

    await connect();

    expect(toast.warning).toHaveBeenCalledWith(
      "1 of 2 repositories connected",
      expect.objectContaining({
        description: "1 failed — you can retry from Repositories.",
      }),
    );
    expect(replace).toHaveBeenCalledWith("/acme");
  });

  it("stays on the step when every repository failed", async () => {
    vi.mocked(connectRepositories).mockResolvedValue({
      data: { items: [FAILED] },
    });
    const { connect, refetch } = setup("acme");

    await connect();

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to connect repositories. Please try again.",
    );
    expect(replace).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it("never redirects without a redirect slug (Settings modal)", async () => {
    vi.mocked(connectRepositories).mockResolvedValue({ data: { items: [OK] } });
    const { connect } = setup();

    await connect();

    expect(replace).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("refreshes the integrations when GitHub access was removed", async () => {
    vi.mocked(connectRepositories).mockRejectedValue(
      axiosError(409, "github_uninstalled"),
    );
    const { connect, invalidatedKeys } = setup("acme");

    await expect(connect()).rejects.toBeInstanceOf(AxiosError);

    expect(invalidatedKeys()).toContainEqual(["integrations", "list", "org_1"]);
    expect(toast.error).toHaveBeenCalledWith(GITHUB_ACCESS_REMOVED_MESSAGE);
  });

  it("explains a 403 and falls back to the error message otherwise", async () => {
    vi.mocked(connectRepositories).mockRejectedValueOnce(
      axiosError(403, "forbidden"),
    );
    const { connect } = setup();
    await expect(connect()).rejects.toBeInstanceOf(AxiosError);
    expect(toast.error).toHaveBeenLastCalledWith(
      CONNECT_REPOS_FORBIDDEN_MESSAGE,
    );

    vi.mocked(connectRepositories).mockRejectedValueOnce(
      axiosError(500, "boom"),
    );
    await expect(connect()).rejects.toBeInstanceOf(AxiosError);
    expect(toast.error).toHaveBeenLastCalledWith("Request failed");
  });
});
