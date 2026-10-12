import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { CommentScope } from "@/lib/types/pull-request.types";
import { getPullRequestComments } from "@/services/pull-requests.service";

import OutdatedComments from "../OutdatedComments";

vi.mock("@/services/pull-requests.service", () => ({
  getPullRequestComments: vi.fn(),
  createPullRequestComment: vi.fn(),
  retryCommentSync: vi.fn(),
}));

const SCOPE: CommentScope = {
  orgId: "org_1",
  repoId: "repo_1",
  pullId: "pr_1",
  headSha: "sha_head",
  providerName: "GitHub",
  canComment: false,
};

describe("OutdatedComments", () => {
  it("lists threads from an earlier commit with their old position", async () => {
    vi.mocked(getPullRequestComments).mockResolvedValue({
      data: {
        threads: [
          {
            id: "t1",
            kind: "inline",
            path: "src/a.ts",
            line: 155,
            side: "old",
            headSha: "sha_old",
            outdated: true,
            comments: [
              {
                id: "c1",
                origin: "critiq",
                author: {
                  name: "Ilham",
                  avatarUrl: null,
                  critiqUserId: "u1",
                  providerUsername: null,
                },
                body: "This moved",
                createdAt: "2026-10-12T03:00:00Z",
                editedAt: null,
                deleted: false,
                sync: null,
              },
            ],
          },
        ],
      },
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <OutdatedComments scope={SCOPE} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Outdated comments")).toBeInTheDocument();
    expect(screen.getByText("src/a.ts:155 (removed line)")).toBeInTheDocument();
    expect(screen.getByText("This moved")).toBeInTheDocument();
  });
});
