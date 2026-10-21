import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import BranchMultiSelect from "../BranchMultiSelect";

const ORIGINAL_INNER_WIDTH = window.innerWidth;

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
};

const mockTriggerRect = (left: number, width: number) => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    left,
    width,
    right: left + width,
    top: 100,
    bottom: 130,
    height: 30,
    x: left,
    y: 100,
    toJSON: () => ({}),
  });
};

const openPanel = () => {
  render(
    <BranchMultiSelect
      branches={["main", "develop"]}
      defaultBranch="main"
      total={2}
      truncated={false}
      selected={{ main: true }}
      onToggle={vi.fn()}
      query=""
      onQueryChange={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button"));
  return screen
    .getByPlaceholderText("Search branches…")
    .closest<HTMLElement>("[style]");
};

describe("BranchMultiSelect panel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setViewportWidth(ORIGINAL_INNER_WIDTH);
  });

  it("matches the trigger when it is wide enough", () => {
    setViewportWidth(1280);
    mockTriggerRect(400, 380);

    const panel = openPanel();

    expect(panel).toHaveStyle({ left: "400px", width: "380px" });
  });

  it("widens a narrow trigger and keeps the panel inside a phone viewport", () => {
    setViewportWidth(320);
    mockTriggerRect(150, 120);

    const panel = openPanel();

    // 256px min width; shifted left so it ends 8px before the right edge.
    expect(panel).toHaveStyle({ left: "56px", width: "256px" });
  });

  it("never exceeds the viewport width", () => {
    setViewportWidth(240);
    mockTriggerRect(20, 200);

    const panel = openPanel();

    expect(panel).toHaveStyle({ left: "8px", width: "224px" });
  });
});
