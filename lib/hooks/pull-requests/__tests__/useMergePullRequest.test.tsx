import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMergeErrorMessage } from "@/const/pull-request.constant";
import { repositoryKeys } from "@/lib/hooks/repositories/queryKeys";
import { toast } from "@/lib/toast";
import { mergePullRequest } from "@/services/pull-requests.service";

import { pullRequestKeys } from "../queryKeys";
import { useMergePullRequest } from "../useMergePullRequest";

vi.mock("@/services/pull-requests.service", () => ({
  mergePullRequest: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

const PR = ["org_1", "repo_1", "pr_1"] as const;
const INPUT = { method: "squash" } as never;

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () =>
      useMergePullRequest(...PR, {
        providerName: "GitHub",
        targetBranch: "main",
      }),
    { wrapper },
  );
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

const rejectWith = (status: number, data: object, message = "boom") =>
  vi
    .mocked(mergePullRequest)
    .mockRejectedValue(
      Object.assign(new Error(message), { response: { status, data } }),
    );

const merge = (result: ReturnType<typeof setup>["result"]) =>
  act(() => expect(result.current.handleMerge(INPUT)).rejects.toThrow());

describe("useMergePullRequest", () => {
  afterEach(() => vi.clearAllMocks());

  it("refreshes the PR, lists and reviews after merging", async () => {
    vi.mocked(mergePullRequest).mockResolvedValue({ data: {} } as never);
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleMerge(INPUT));

    expect(mergePullRequest).toHaveBeenCalledWith(...PR, INPUT);
    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        pullRequestKeys.detail(...PR),
        pullRequestKeys.list("org_1"),
        pullRequestKeys.reviews(...PR),
        repositoryKeys.pulls("org_1", "repo_1"),
      ]),
    );
    expect(toast.success).toHaveBeenCalledWith("Merged into main");
  });

  it("reloads detail, diff and summary when the head moved on", async () => {
    rejectWith(409, { message: "head_changed" });
    const { result, invalidatedKeys } = setup();

    await merge(result);

    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        pullRequestKeys.detail(...PR),
        pullRequestKeys.diff(...PR),
        pullRequestKeys.summary(...PR),
      ]),
    );
    expect(result.current.mergeError).toBe(
      getMergeErrorMessage("head_changed", "GitHub"),
    );
  });

  it("reloads only the detail for an unknown blocker", async () => {
    rejectWith(422, { message: "approval_required" });
    const { result, invalidatedKeys } = setup();

    await merge(result);

    expect(invalidatedKeys()).toEqual([pullRequestKeys.detail(...PR)]);
    expect(result.current.mergeError).toBe(
      getMergeErrorMessage("approval_required", "GitHub"),
    );
  });

  it("shows the provider's own explanation for not_mergeable", async () => {
    rejectWith(409, { message: "not_mergeable", detail: "Merge conflict" });
    const { result, invalidatedKeys } = setup();

    await merge(result);

    expect(result.current.mergeError).toBe("Merge conflict");
    expect(invalidatedKeys()).toHaveLength(0);
  });

  it("names the provider in permission errors", async () => {
    rejectWith(403, { message: "insufficient_permission" });
    const { result } = setup();

    await merge(result);

    expect(result.current.mergeError).toContain("GitHub");
  });

  it("falls back to the BE message, then the error message", async () => {
    rejectWith(400, { message: "Something odd" });
    const { result } = setup();

    await merge(result);
    expect(result.current.mergeError).toBe("Something odd");

    rejectWith(500, {}, "Network Error");
    await merge(result);
    expect(result.current.mergeError).toBe("Network Error");

    act(() => result.current.clearMergeError());
    expect(result.current.mergeError).toBeNull();
  });
});
