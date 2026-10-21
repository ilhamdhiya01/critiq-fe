import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPullRequestDetailDiff } from "@/services/pull-requests.service";

import { usePullRequestDetailDiff } from "../usePullRequestDetailDiff";

vi.mock("@/services/pull-requests.service", () => ({
  getPullRequestDetailDiff: vi.fn(),
}));

const PATCH = "@@ -1,2 +1,2 @@\n-old\n+new\n same";

const setup = (id = "pr_1") => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => usePullRequestDetailDiff("org_1", "repo_1", id),
    { wrapper },
  );
  return { result };
};

describe("usePullRequestDetailDiff", () => {
  afterEach(() => vi.mocked(getPullRequestDetailDiff).mockReset());

  it("waits until every id is known", () => {
    setup("");

    expect(getPullRequestDetailDiff).not.toHaveBeenCalled();
  });

  it("parses each patch and counts changed lines", async () => {
    vi.mocked(getPullRequestDetailDiff).mockResolvedValue({
      data: {
        truncated: false,
        files: [
          { filename: "a.ts", patch: PATCH },
          { filename: "b.bin", patch: null },
        ],
      },
    } as never);

    const { result } = setup();

    await waitFor(() => expect(result.current.data).toBeDefined());
    const [text, binary] = result.current.data!.files;
    expect(text.lines.map((line) => line.type)).toEqual([
      "hunk",
      "removed",
      "added",
      "context",
    ]);
    expect(text).toMatchObject({ addedCount: 1, removedCount: 1 });
    expect(binary).toMatchObject({ lines: [], addedCount: 0, removedCount: 0 });
    expect(result.current.data!.truncated).toBe(false);
  });

  it("prefers the provider's counts when sent", async () => {
    vi.mocked(getPullRequestDetailDiff).mockResolvedValue({
      data: {
        truncated: true,
        files: [{ filename: "a.ts", patch: PATCH, additions: 9, deletions: 4 }],
      },
    } as never);

    const { result } = setup();

    await waitFor(() =>
      expect(result.current.data?.files[0]).toMatchObject({
        addedCount: 9,
        removedCount: 4,
      }),
    );
    expect(result.current.data?.truncated).toBe(true);
  });
});
