import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchEntry } from "@/lib/types/search.types";

import SearchDropdown from "../SearchDropdown";

const ENTRIES: SearchEntry[] = [
  {
    key: "repo-1",
    group: "repositories",
    label: "acme/critiq-core",
    meta: { kind: "critical", text: "2 critical" },
    href: "/acme/repositories/1",
  },
  {
    key: "pull-1",
    group: "pulls",
    label: "Fix login",
    meta: { kind: "pull", repoPath: "acme/platform/core", state: "merged" },
    href: "/acme/pull-requests/1",
  },
  {
    key: "page-1",
    group: "pages",
    label: "Settings",
    meta: null,
    href: "/acme/settings",
  },
];

const getOptionId = (index: number) => `search-option-${index}`;

const renderDropdown = (activeIndex = 0) => {
  const onSelect = vi.fn();
  const onHover = vi.fn();
  const utils = render(
    <SearchDropdown
      listboxId="search-results"
      getOptionId={getOptionId}
      entries={ENTRIES}
      activeIndex={activeIndex}
      query="i"
      isUnavailable={false}
      isSearching={false}
      onSelect={onSelect}
      onHover={onHover}
    />,
  );
  return { ...utils, onSelect, onHover };
};

describe("SearchDropdown", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    // jsdom has no scrollIntoView of its own.
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    scrollIntoView.mockReset();
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  it("exposes the keyboard selection as the active option", () => {
    const { rerender, onSelect, onHover } = renderDropdown(1);
    const options = screen.getAllByRole("option");

    expect(options.map((o) => o.getAttribute("aria-selected"))).toEqual([
      "false",
      "true",
      "false",
    ]);
    // The input points aria-activedescendant at these ids.
    expect(options[1]).toHaveAttribute("id", "search-option-1");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    rerender(
      <SearchDropdown
        listboxId="search-results"
        getOptionId={getOptionId}
        entries={ENTRIES}
        activeIndex={2}
        query="i"
        isUnavailable={false}
        isSearching={false}
        onSelect={onSelect}
        onHover={onHover}
      />,
    );
    expect(screen.getAllByRole("option")[2]).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("moves the selection on hover and opens the clicked entry", () => {
    const { onSelect, onHover } = renderDropdown();
    const option = screen.getByRole("option", { name: /Fix login/ });

    fireEvent.mouseEnter(option);
    expect(onHover).toHaveBeenCalledWith(1);

    fireEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith(ENTRIES[1]);
  });

  it("keeps focus in the input on mousedown", () => {
    renderDropdown();

    // fireEvent returns false when the default was prevented.
    expect(
      fireEvent.mouseDown(screen.getByRole("option", { name: /Settings/ })),
    ).toBe(false);
  });
});
