import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import type { Integration } from "@/lib/types/integration.types";

import {
  getErrorCode,
  getIntegrationStatus,
  isGitHubAccessError,
} from "../integration.helper";

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
  installationId: "1",
  installationLogin: "cititex",
  appSlug: "critiq",
};

const axiosErrorWith = (status: number, data: unknown) =>
  new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);

describe("getIntegrationStatus — GitHub App lifecycle", () => {
  it("maps UNINSTALLED and SUSPENDED", () => {
    expect(getIntegrationStatus({ ...GITHUB, state: "UNINSTALLED" })).toEqual(
      expect.objectContaining({ label: "Uninstalled on GitHub", tone: "red" }),
    );
    expect(getIntegrationStatus({ ...GITHUB, state: "SUSPENDED" })).toEqual(
      expect.objectContaining({ label: "Suspended on GitHub", tone: "orange" }),
    );
  });

  it("does not crash on a state added by the BE later", () => {
    const unknown = {
      ...GITHUB,
      state: "SOMETHING_NEW",
    } as unknown as Integration;
    expect(getIntegrationStatus(unknown)).toEqual({
      label: "Unknown",
      tone: "red",
      message: null,
    });
  });
});

describe("GitHub access errors", () => {
  it("recognises github_uninstalled / github_suspended", () => {
    expect(isGitHubAccessError("github_uninstalled")).toBe(true);
    expect(isGitHubAccessError("github_suspended")).toBe(true);
    expect(isGitHubAccessError("token_expired")).toBe(false);
    expect(isGitHubAccessError(null)).toBe(false);
  });

  it("reads the code from errors[] or a top-level message", () => {
    expect(
      getErrorCode(
        axiosErrorWith(409, {
          errors: [{ field: "github", message: "github_uninstalled" }],
        }),
      ),
    ).toBe("github_uninstalled");
    expect(
      getErrorCode(axiosErrorWith(502, { message: "github_unreachable" })),
    ).toBe("github_unreachable");
    expect(getErrorCode(null)).toBeNull();
  });
});
