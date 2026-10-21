import { beforeEach, describe, expect, it, vi } from "vitest";

import axiosInstance from "@/lib/axios";

import { regeneratePullRequestSummary } from "../pull-requests.service";

vi.mock("@/lib/axios", () => ({
  default: { post: vi.fn() },
}));

describe("regeneratePullRequestSummary", () => {
  beforeEach(() => {
    vi.mocked(axiosInstance.post)
      .mockReset()
      .mockResolvedValue({ data: { data: null } });
  });

  it("forces a fresh AI review instead of reusing the cache", async () => {
    await regeneratePullRequestSummary("org_1", "repo_1", "pr_1");

    expect(axiosInstance.post).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/orgs\/org_1\/repos\/repo_1\/pulls\/pr_1\/summary\/regenerate$/,
      ),
      { force: true },
    );
  });
});
