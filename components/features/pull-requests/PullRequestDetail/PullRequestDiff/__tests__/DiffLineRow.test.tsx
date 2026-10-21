import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import type { DiffLine } from "@/lib/types/pull-request.types";

import DiffLineRow from "../DiffLineRow";

const ADDED: DiffLine = {
  type: "added",
  oldLineNumber: null,
  newLineNumber: 11,
  content: "newCall();",
};

describe("DiffLineRow", () => {
  it("selects its own index when commenting is allowed", () => {
    const onSelect = vi.fn();
    render(
      <DiffLineRow
        line={ADDED}
        index={4}
        isActive={false}
        onSelect={onSelect}
        isSelectable
      />,
    );

    fireEvent.click(screen.getByText("newCall();"));

    expect(onSelect).toHaveBeenCalledWith(4);
  });

  it("ignores clicks when the viewer cannot comment", () => {
    const onSelect = vi.fn();
    render(
      <DiffLineRow
        line={ADDED}
        index={4}
        isActive={false}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByText("newCall();"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders a hunk header as a plain, unselectable row", () => {
    const onSelect = vi.fn();
    render(
      <DiffLineRow
        line={{
          type: "hunk",
          oldLineNumber: null,
          newLineNumber: null,
          content: "@@ -1,3 +1,4 @@",
        }}
        index={0}
        isActive={false}
        onSelect={onSelect}
        isSelectable
      />,
    );

    fireEvent.click(screen.getByText("@@ -1,3 +1,4 @@"));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
