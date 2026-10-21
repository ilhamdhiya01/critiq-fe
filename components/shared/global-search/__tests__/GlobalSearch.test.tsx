import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActiveOrgTestProvider from "@/lib/test-utils/ActiveOrgTestProvider";
import type { GlobalSearchResult } from "@/lib/types/search.types";
import { getGlobalSearch } from "@/services/search.service";

import GlobalSearch from "../GlobalSearch";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "acme" }),
  useRouter: () => ({ push }),
}));

vi.mock("@/services/search.service", () => ({
  getGlobalSearch: vi.fn(),
}));

const RESULT: GlobalSearchResult = {
  repositories: [
    {
      id: "repo_1",
      path: "acme/payments-api",
      language: "Go",
      openCriticalCount: 2,
    },
    {
      id: "repo_2",
      path: "acme/web-console",
      language: "TypeScript",
      openCriticalCount: 0,
    },
  ],
  pulls: [
    {
      id: "pr_1",
      repoId: "repo_1",
      repoPath: "acme/payments-api",
      number: "482",
      title: "Refactor auth token",
      state: "open",
      updatedAt: "2026-10-12T03:00:00Z",
    },
  ],
  rules: [
    {
      kind: "tier",
      id: "secrets",
      label: "Secrets",
      tier: "secrets",
    },
  ],
};

const renderSearch = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ActiveOrgTestProvider orgId="org_1">
        <GlobalSearch />
        <p>Outside</p>
      </ActiveOrgTestProvider>
    </QueryClientProvider>,
  );

const input = () => screen.getByRole("combobox", { name: "Search" });
const listbox = () => screen.findByRole("listbox");
const activeLabel = () =>
  screen
    .getAllByRole("option")
    .find((option) => option.getAttribute("aria-selected") === "true")
    ?.textContent;

describe("GlobalSearch", { timeout: 15_000 }, () => {
  beforeEach(() => {
    push.mockReset();
    vi.mocked(getGlobalSearch).mockReset();
    vi.mocked(getGlobalSearch).mockResolvedValue({ data: RESULT });
  });

  it("opens with ⌘K or Ctrl+K and closes with Esc or an outside click", async () => {
    renderSearch();
    expect(input()).toHaveAttribute("aria-expanded", "false");

    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(input()).toHaveFocus();
    await listbox();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(input()).toHaveAttribute("aria-expanded", "false");

    fireEvent.keyDown(document, { key: "K", ctrlKey: true });
    expect(input()).toHaveAttribute("aria-expanded", "true");

    fireEvent.mouseDown(screen.getByText("Outside"));
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("shows only pages and never calls the BE for an empty query", async () => {
    renderSearch();
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: "   " } });

    expect(await screen.findByText("Pages")).toBeInTheDocument();
    expect(screen.queryByText("Repositories", { selector: "li" })).toBeNull();
    expect(screen.getAllByRole("option")).toHaveLength(7);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(getGlobalSearch).not.toHaveBeenCalled();
  });

  it("debounces typing into a single request", async () => {
    renderSearch();
    fireEvent.focus(input());
    for (const value of ["p", "pa", "pay"]) {
      fireEvent.change(input(), { target: { value } });
    }

    await waitFor(() => expect(getGlobalSearch).toHaveBeenCalledTimes(1));
    expect(getGlobalSearch).toHaveBeenCalledWith(
      "org_1",
      "pay",
      expect.objectContaining({ limit: 5 }),
    );
  });

  it("labels repos with criticals or their language and filters pages locally", async () => {
    renderSearch();
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: "set" } });

    const list = await listbox();
    await within(list).findByText("2 critical");
    expect(within(list).getByText("2 critical")).toHaveClass(
      "text-danger-light",
    );
    expect(within(list).getByText("TypeScript")).toBeInTheDocument();
    // "set" matches only the Settings page.
    expect(within(list).getByText("PAGE").closest("li")).toHaveTextContent(
      "Settings",
    );
    expect(within(list).getAllByText("PAGE")).toHaveLength(1);
  });

  it("moves across groups with ↑/↓, wraps, and opens with Enter", async () => {
    renderSearch();
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: "set" } });
    await screen.findByText("2 critical");

    // repo, repo, PR, rule, page
    expect(activeLabel()).toContain("acme/payments-api");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(activeLabel()).toContain("#482 Refactor auth token");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(activeLabel()).toContain("Secrets");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    // Wrapped back to the first row.
    expect(activeLabel()).toContain("acme/payments-api");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(activeLabel()).toContain("Settings");

    fireEvent.keyDown(input(), { key: "ArrowUp" });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/acme/rules?tier=secrets");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveValue("");
  });

  it("opens each kind of result on click", async () => {
    renderSearch();
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: "set" } });
    await screen.findByText("2 critical");

    fireEvent.click(screen.getByText(/Refactor auth token/));
    expect(push).toHaveBeenLastCalledWith(
      "/acme/pull-requests/pr_1?repoId=repo_1",
    );

    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: "set" } });
    fireEvent.click(await screen.findByText("web-console", { exact: false }));
    expect(push).toHaveBeenLastCalledWith("/acme/repositories/repo_2");
  });

  it("highlights the matching text", async () => {
    renderSearch();
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: "482" } });

    const list = await listbox();
    const mark = await within(list).findByText("482", { selector: "mark" });
    expect(mark.closest("li")).toHaveTextContent("#482 Refactor auth token");
  });

  it("keeps pages when search fails and says so", async () => {
    vi.mocked(getGlobalSearch).mockRejectedValue(new Error("boom"));
    renderSearch();
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: "sett" } });

    expect(await screen.findByText("Search unavailable")).toBeInTheDocument();
    // Highlighting splits "Sett|ings", so check the row's text.
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["PAGESettings"]);
  });

  it("says when nothing matches", async () => {
    vi.mocked(getGlobalSearch).mockResolvedValue({
      data: { repositories: [], pulls: [], rules: [] },
    });
    renderSearch();
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: "zzz" } });

    expect(await screen.findByText('No results for "zzz"')).toBeInTheDocument();
  });
});
