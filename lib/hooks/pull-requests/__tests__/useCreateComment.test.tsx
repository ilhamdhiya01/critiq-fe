import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { COMMENT_ERROR_MESSAGE } from "@/const/pull-request.constant";
import { createPullRequestComment } from "@/services/pull-requests.service";

import { pullRequestKeys } from "../queryKeys";
import { useCreateComment } from "../useCreateComment";

vi.mock("@/services/pull-requests.service", () => ({
  createPullRequestComment: vi.fn(),
}));

const PR = ["org_1", "repo_1", "pr_1"] as const;
const INPUT = { body: "Looks good" };

const setup = () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCreateComment(...PR), { wrapper });
  const invalidatedKeys = () =>
    invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { result, invalidatedKeys };
};

const rejectWith = (status: number, data: object, message = "boom") =>
  vi
    .mocked(createPullRequestComment)
    .mockRejectedValue(
      Object.assign(new Error(message), { response: { status, data } }),
    );

const submit = async (result: ReturnType<typeof setup>["result"]) =>
  act(() =>
    expect(
      result.current.handleCreateComment(INPUT as never),
    ).rejects.toThrow(),
  );

describe("useCreateComment", () => {
  afterEach(() => vi.clearAllMocks());

  it("refetches the comments after posting", async () => {
    vi.mocked(createPullRequestComment).mockResolvedValue({
      data: {},
    } as never);
    const { result, invalidatedKeys } = setup();

    await act(() => result.current.handleCreateComment(INPUT as never));

    expect(createPullRequestComment).toHaveBeenCalledWith(...PR, INPUT);
    expect(invalidatedKeys()).toEqual([pullRequestKeys.comments(...PR)]);
    expect(result.current.createError).toBeNull();
  });

  it("reloads detail, diff and comments when the head moved on", async () => {
    rejectWith(409, {
      errors: [{ field: "headSha", message: "head_changed" }],
    });
    const { result, invalidatedKeys } = setup();

    await submit(result);

    expect(invalidatedKeys()).toEqual(
      expect.arrayContaining([
        pullRequestKeys.detail(...PR),
        pullRequestKeys.diff(...PR),
        pullRequestKeys.comments(...PR),
      ]),
    );
    expect(result.current.createError).toBe(COMMENT_ERROR_MESSAGE.head_changed);
  });

  it("reports 403 as forbidden", async () => {
    rejectWith(403, { message: "role_too_low" });
    const { result, invalidatedKeys } = setup();

    await submit(result);

    expect(result.current.createError).toBe(COMMENT_ERROR_MESSAGE.forbidden);
    expect(invalidatedKeys()).toHaveLength(0);
  });

  it("falls back to the BE message, then the error message", async () => {
    rejectWith(400, { message: "Body too long" });
    const { result } = setup();

    await submit(result);
    expect(result.current.createError).toBe("Body too long");

    rejectWith(500, {}, "Network Error");
    await submit(result);
    expect(result.current.createError).toBe("Network Error");

    act(() => result.current.clearCreateError());
    expect(result.current.createError).toBeNull();
  });
});
