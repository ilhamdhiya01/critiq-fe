import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { IntegrationSource } from "@/lib/types/integration.types";
import { getIntegrationCandidates } from "@/services/integrations.service";

import { useIntegrationCandidates } from "../useIntegrationCandidates";

vi.mock("@/services/integrations.service", () => ({
  getIntegrationCandidates: vi.fn(),
}));

const setup = (source: IntegrationSource, enabled = true) => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => useIntegrationCandidates("org_1", source, enabled),
    { wrapper },
  );
  return { result };
};

const httpError = (status: number, errors: object[]) =>
  Object.assign(new Error("Request failed"), {
    response: { status, data: { errors } },
  });

describe("useIntegrationCandidates", () => {
  afterEach(() => vi.mocked(getIntegrationCandidates).mockReset());

  it("does not fetch while disabled", () => {
    setup("github", false);

    expect(getIntegrationCandidates).not.toHaveBeenCalled();
  });

  it("normalizes GitHub's private flag to a visibility", async () => {
    vi.mocked(getIntegrationCandidates).mockResolvedValue({
      data: [
        { id: 1, path: "acme/api", lang: "Go", private: true },
        { id: 2, path: "acme/web", lang: null, private: false },
      ],
    });

    const { result } = setup("github");

    await waitFor(() =>
      expect(result.current.data).toEqual([
        {
          id: 1,
          path: "acme/api",
          lang: "Go",
          visibility: "private",
          accessLevel: undefined,
        },
        {
          id: 2,
          path: "acme/web",
          lang: null,
          visibility: "public",
          accessLevel: undefined,
        },
      ]),
    );
    expect(getIntegrationCandidates).toHaveBeenCalledWith("org_1", "github");
  });

  it("keeps GitLab's access level and treats non-private as public", async () => {
    vi.mocked(getIntegrationCandidates).mockResolvedValue({
      data: [
        {
          id: 3,
          path: "grp/a",
          lang: "Ruby",
          visibility: "private",
          accessLevel: 40,
        },
        {
          id: 4,
          path: "grp/b",
          lang: null,
          visibility: "internal",
          accessLevel: 50,
        },
      ],
    });

    const { result } = setup("gitlab");

    await waitFor(() =>
      expect(
        result.current.data?.map(({ visibility, accessLevel }) => ({
          visibility,
          accessLevel,
        })),
      ).toEqual([
        { visibility: "private", accessLevel: 40 },
        { visibility: "public", accessLevel: 50 },
      ]),
    );
  });

  it("flags a provider that is not connected", async () => {
    vi.mocked(getIntegrationCandidates).mockRejectedValue(
      httpError(409, [{ field: "source", message: "gitlab_not_connected" }]),
    );

    const { result } = setup("gitlab");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isNotConnected).toBe(true);
    expect(result.current.errorCode).toBe("gitlab_not_connected");
    expect(result.current.errorStatus).toBe(409);
    // No retries: the error shows right away.
    expect(getIntegrationCandidates).toHaveBeenCalledTimes(1);
  });

  it("reports other errors without the not-connected flag", async () => {
    vi.mocked(getIntegrationCandidates).mockRejectedValue(
      httpError(502, [{ field: "source", message: "provider_unreachable" }]),
    );

    const { result } = setup("github");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isNotConnected).toBe(false);
    expect(result.current.errorCode).toBe("provider_unreachable");
  });

  it("has no error code before anything fails", () => {
    const { result } = setup("github", false);

    expect(result.current.errorCode).toBeNull();
    expect(result.current.errorStatus).toBeNull();
  });
});
