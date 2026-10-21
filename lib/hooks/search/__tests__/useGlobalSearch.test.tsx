import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SEARCH_LIMIT, SEARCH_MAX_LENGTH } from "@/const/search.constant";
import { getGlobalSearch } from "@/services/search.service";

import { searchKeys } from "../queryKeys";
import { useGlobalSearch } from "../useGlobalSearch";

vi.mock("@/services/search.service", () => ({
  getGlobalSearch: vi.fn(),
}));

const result = (path: string) => ({
  data: { repositories: [{ id: path, path }], pulls: [], rules: [] },
});

interface Props {
  orgId: string | undefined;
  query: string;
}

const setup = (initialProps: Props) => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const rendered = renderHook(
    ({ orgId, query }: Props) => useGlobalSearch(orgId, query),
    { wrapper, initialProps },
  );
  return { client, ...rendered };
};

describe("useGlobalSearch", () => {
  afterEach(() => vi.mocked(getGlobalSearch).mockReset());

  it.each([
    ["no org", undefined, "api"],
    ["an empty query", "org_1", "   "],
    ["a query over the limit", "org_1", "a".repeat(SEARCH_MAX_LENGTH + 1)],
  ])("never calls the BE for %s", (_label, orgId, query) => {
    setup({ orgId, query });

    expect(getGlobalSearch).not.toHaveBeenCalled();
  });

  it("searches the trimmed query with the result limit", async () => {
    vi.mocked(getGlobalSearch).mockResolvedValue(result("acme/api") as never);

    const { client, result: hook } = setup({ orgId: "org_1", query: " api " });

    await waitFor(() =>
      expect(hook.current.data?.repositories).toEqual([
        { id: "acme/api", path: "acme/api" },
      ]),
    );
    expect(getGlobalSearch).toHaveBeenCalledWith("org_1", "api", {
      limit: SEARCH_LIMIT,
      signal: expect.any(AbortSignal),
    });
    expect(client.getQueryData(searchKeys.query("org_1", "api"))).toBeDefined();
  });

  it("accepts a query of exactly the maximum length", async () => {
    vi.mocked(getGlobalSearch).mockResolvedValue(result("x") as never);
    const query = "a".repeat(SEARCH_MAX_LENGTH);

    setup({ orgId: "org_1", query });

    await waitFor(() =>
      expect(getGlobalSearch).toHaveBeenCalledWith(
        "org_1",
        query,
        expect.anything(),
      ),
    );
  });

  it("keeps the previous results while the next query loads", async () => {
    let resolveNext: (value: unknown) => void = () => {};
    vi.mocked(getGlobalSearch)
      .mockResolvedValueOnce(result("acme/api") as never)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNext = resolve;
          }) as never,
      );

    const { result: hook, rerender } = setup({ orgId: "org_1", query: "api" });
    await waitFor(() => expect(hook.current.data).toBeDefined());

    rerender({ orgId: "org_1", query: "web" });

    await waitFor(() => expect(hook.current.isFetching).toBe(true));
    expect(hook.current.isPlaceholderData).toBe(true);
    expect(hook.current.data?.repositories[0].path).toBe("acme/api");

    resolveNext(result("acme/web"));
    await waitFor(() =>
      expect(hook.current.data?.repositories[0].path).toBe("acme/web"),
    );
  });
});
