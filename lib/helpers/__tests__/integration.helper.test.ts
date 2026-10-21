import { describe, expect, it } from "vitest";

import type { Integration } from "@/lib/types/integration.types";

import { getDaysUntil } from "../date.helper";
import {
  countReposByProvider,
  getConnectableProvider,
  getIntegrationErrorMessage,
  getIntegrationStatus,
  hostOf,
  splitIntegrations,
  toGitLabFieldErrors,
  upsertIntegration,
} from "../integration.helper";

const NOW = Date.parse("2026-10-07T00:00:00.000Z");

const GITLAB: Integration = {
  source: "GITLAB",
  credentialKind: "GROUP_TOKEN",
  state: "ACTIVE",
  instanceUrl: "https://gitlab.com",
  tokenKind: "GROUP",
  tokenUsername: "group_bot",
  tokenLast4: "a1b2",
  expiresAt: "2026-10-12T00:00:00.000Z",
  groups: [],
  installationId: null,
  installationLogin: null,
  appSlug: null,
};

const GITHUB: Integration = {
  source: "GITHUB",
  credentialKind: "INSTALLATION",
  state: "ACTIVE",
  instanceUrl: null,
  tokenKind: null,
  tokenUsername: null,
  tokenLast4: null,
  expiresAt: null,
  groups: null,
  installationId: "123",
  installationLogin: "cititex",
  appSlug: "critiq",
};

describe("getIntegrationStatus", () => {
  it("maps GitHub states", () => {
    expect(getIntegrationStatus(GITHUB).label).toBe("Connected");
    expect(
      getIntegrationStatus({ ...GITHUB, state: "PENDING_APPROVAL" }),
    ).toEqual({
      label: "Waiting for owner approval",
      tone: "orange",
      message:
        "A GitHub organization owner must approve the installation request (GitHub → Settings → GitHub Apps → Pending requests)",
    });
    expect(getIntegrationStatus({ ...GITHUB, state: "INVALID" })).toEqual({
      label: "Error",
      tone: "red",
      message: null,
    });
  });

  it("maps GitLab states with their messages", () => {
    expect(getIntegrationStatus(GITLAB, NOW)).toEqual({
      label: "Connected",
      tone: "green",
      message: null,
    });
    expect(
      getIntegrationStatus({ ...GITLAB, state: "EXPIRING_SOON" }, NOW).message,
    ).toBe("Token expires in 5 days");
    expect(
      getIntegrationStatus({ ...GITLAB, state: "TOKEN_EXPIRED" }, NOW).message,
    ).toBe("Token expired — scans paused");
    expect(
      getIntegrationStatus({ ...GITLAB, state: "INVALID" }, NOW).message,
    ).toBe("Token rejected by GitLab");
  });
});

describe("getDaysUntil", () => {
  it("rounds up and goes negative once passed", () => {
    expect(getDaysUntil("2026-10-12T00:00:00.000Z", NOW)).toBe(5);
    expect(getDaysUntil("2026-10-07T06:00:00.000Z", NOW)).toBe(1);
    expect(getDaysUntil("2026-10-05T00:00:00.000Z", NOW)).toBe(-2);
  });
});

describe("toGitLabFieldErrors", () => {
  it("maps token and instance_url errors to copy", () => {
    expect(
      toGitLabFieldErrors([
        { field: "token", message: "scope_missing" },
        { field: "instance_url", message: "instance_unreachable" },
        { field: "other", message: "token_invalid" },
      ]),
    ).toEqual({
      token: "Token needs the api scope.",
      instance_url: "GitLab instance unreachable — check the URL.",
    });
  });
});

describe("getIntegrationErrorMessage", () => {
  it("uses the admin message for 403 and copy for known codes", () => {
    expect(getIntegrationErrorMessage(403, "forbidden")).toBe(
      "Only Admins can change integrations.",
    );
    expect(getIntegrationErrorMessage(502, "provider_unreachable")).toBe(
      "GitLab is not responding, try again later.",
    );
    expect(getIntegrationErrorMessage(500, "unknown_code")).toBe(
      "unknown_code",
    );
  });
});

describe("splitIntegrations / upsertIntegration", () => {
  it("splits by source and replaces an existing source", () => {
    expect(splitIntegrations([])).toEqual({ github: null, gitlab: null });
    expect(splitIntegrations([GITHUB, GITLAB]).gitlab?.tokenLast4).toBe("a1b2");

    const replaced = upsertIntegration([GITHUB, GITLAB], {
      ...GITLAB,
      tokenLast4: "zzzz",
    });
    expect(replaced).toHaveLength(2);
    expect(splitIntegrations(replaced).gitlab?.tokenLast4).toBe("zzzz");
  });

  it("accepts a lower-case state from the BE", () => {
    const pending = {
      ...GITHUB,
      state: "pending_approval",
    } as unknown as Integration;

    expect(splitIntegrations([pending]).github?.state).toBe("PENDING_APPROVAL");
  });
});

describe("countReposByProvider", () => {
  it("counts repos per provider", () => {
    expect(
      countReposByProvider([
        {
          id: "1",
          provider: "GITHUB",
          path: "a/b",
          defaultBranch: "main",
          monitoredBranchCount: 1,
        },
        {
          id: "2",
          provider: "GITLAB",
          path: "c/d",
          defaultBranch: "main",
          monitoredBranchCount: 2,
        },
        {
          id: "3",
          provider: "GITLAB",
          path: "e/f",
          defaultBranch: "main",
          monitoredBranchCount: 1,
        },
      ]),
    ).toEqual({ GITHUB: 1, GITLAB: 2 });
    expect(countReposByProvider([])).toEqual({ GITHUB: 0, GITLAB: 0 });
  });
});

describe("hostOf", () => {
  it("returns the host or the raw value", () => {
    expect(hostOf("https://gitlab.cititex.io/")).toBe("gitlab.cititex.io");
    expect(hostOf("not a url")).toBe("not a url");
  });
});

describe("getConnectableProvider", () => {
  const github = (state: Integration["state"]) =>
    ({ source: "GITHUB", state }) as Integration;
  const gitlab = { source: "GITLAB", state: "ACTIVE" } as Integration;

  it("uses GitHub only while the App is active", () => {
    expect(
      getConnectableProvider({ github: github("ACTIVE"), gitlab: null }),
    ).toBe("GITHUB");
    expect(
      getConnectableProvider({ github: github("UNINSTALLED"), gitlab: null }),
    ).toBeNull();
  });

  it("falls back to a connected GitLab, else nothing", () => {
    expect(
      getConnectableProvider({ github: github("SUSPENDED"), gitlab }),
    ).toBe("GITLAB");
    expect(getConnectableProvider({ github: null, gitlab: null })).toBeNull();
    expect(getConnectableProvider(undefined)).toBeNull();
  });
});
