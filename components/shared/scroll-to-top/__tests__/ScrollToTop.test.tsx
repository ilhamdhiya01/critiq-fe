import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import ScrollToTop from "../ScrollToTop";

const renderInScroller = () => {
  render(
    <div data-testid="scroller" style={{ overflowY: "auto" }}>
      <ScrollToTop threshold={600} />
    </div>,
  );
  return screen.getByTestId("scroller");
};

const scrollTo = (element: HTMLElement, top: number) => {
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    value: top,
  });
  fireEvent.scroll(element);
};

describe("ScrollToTop", () => {
  it("stays hidden until the scroll container passes the threshold", () => {
    const scroller = renderInScroller();

    expect(
      screen.queryByRole("button", { name: "Kembali ke atas" }),
    ).not.toBeInTheDocument();

    scrollTo(scroller, 800);
    expect(
      screen.getByRole("button", { name: "Kembali ke atas" }),
    ).toBeInTheDocument();

    scrollTo(scroller, 100);
    expect(
      screen.queryByRole("button", { name: "Kembali ke atas" }),
    ).not.toBeInTheDocument();
  });

  it("scrolls the nearest scroll container back to the top", () => {
    const scroller = renderInScroller();
    const scrollToSpy = vi.fn();
    scroller.scrollTo = scrollToSpy;

    scrollTo(scroller, 800);
    fireEvent.click(screen.getByRole("button", { name: "Kembali ke atas" }));

    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0 }),
    );
  });
});
