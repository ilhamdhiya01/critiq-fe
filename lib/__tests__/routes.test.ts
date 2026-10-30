import { describe, expect, it } from "vitest";

import {
  API_INTEGRATION_REPO_BRANCHES,
  API_INVITE_ACCEPT,
  API_ORG_MEMBER,
  API_PULL_COMMENT_SYNC,
  API_PULL_MERGE,
  API_PULL_RESCAN,
  isPublicPath,
  ROUTES,
} from "@/routes";

const EVIL = "../../x?a=1#b";
const ENCODED = "..%2F..%2Fx%3Fa%3D1%23b";

describe("isPublicPath", () => {
  it("lets the invite page open without a session", () => {
    expect(isPublicPath("/invite/tok_123")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
  });

  it("keeps everything else private", () => {
    expect(isPublicPath("/invite")).toBe(false);
    expect(isPublicPath("/invite/tok/accept")).toBe(false);
    expect(isPublicPath("/acme/settings")).toBe(false);
    expect(isPublicPath("/")).toBe(false);
  });
});

describe("route builders", () => {
  it("keep a crafted id inside its own path segment", () => {
    expect(API_PULL_MERGE("org_1", EVIL, "pr_1")).toBe(
      `/orgs/org_1/repos/${ENCODED}/pulls/pr_1/merge`,
    );
    expect(API_PULL_RESCAN(EVIL, "repo_1")).toBe(
      `/orgs/${ENCODED}/repos/repo_1/rescan`,
    );
    expect(API_PULL_COMMENT_SYNC("org_1", "repo_1", "pr_1", EVIL)).toBe(
      `/orgs/org_1/repos/repo_1/pulls/pr_1/comments/${ENCODED}/sync`,
    );
    expect(API_ORG_MEMBER("org_1", EVIL)).toBe(
      `/orgs/org_1/members/${ENCODED}`,
    );
    expect(API_INVITE_ACCEPT(EVIL)).toBe(`/invites/${ENCODED}/accept`);
    expect(ROUTES.invite(EVIL)).toBe(`/invite/${ENCODED}`);
    expect(ROUTES.pullRequestDetail("acme", "pr_1", EVIL)).toBe(
      `/acme/pull-requests/pr_1?repoId=${ENCODED}`,
    );
  });

  it("leave ordinary ids unchanged", () => {
    expect(API_PULL_MERGE("org_1", "repo_1", "pr_1")).toBe(
      "/orgs/org_1/repos/repo_1/pulls/pr_1/merge",
    );
    expect(API_INTEGRATION_REPO_BRANCHES("org_1", "gitlab", 42)).toBe(
      "/orgs/org_1/integrations/gitlab/repos/42/branches",
    );
    expect(ROUTES.repositoryDetail("acme", "repo_1")).toBe(
      "/acme/repositories/repo_1",
    );
  });
});
