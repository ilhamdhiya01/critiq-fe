import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Role } from "@/lib/types/auth.types";
import type { PullRequestDetail } from "@/lib/types/pull-request.types";

import PullRequestStickyBar from "../PullRequestStickyBar";

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let observerCallback: ObserverCallback | null = null;
const disconnect = vi.fn();

class MockIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }
  observe = vi.fn();
  disconnect = disconnect;
}

const DETAIL = {
  id: "pr_1",
  provider: "GITHUB",
  externalId: "39",
  title: "feat(activity): implement activity tracking",
  authorUsername: "ilham",
  sourceBranch: "feat/activity",
  targetBranch: "development",
  state: "OPEN",
} as PullRequestDetail;

const Harness = ({
  role = "REVIEWER",
  detail = DETAIL,
}: {
  role?: Role;
  detail?: PullRequestDetail;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <PullRequestStickyBar
        targetRef={ref}
        detail={detail}
        additions={467}
        deletions={92}
        role={role}
      />
      <div ref={ref}>Full header</div>
      <div id="pr-review">Review section</div>
    </>
  );
};

// The header scrolled above the top of <main> (or came back).
const scrollHeader = (isPast: boolean) =>
  act(() =>
    observerCallback?.([
      {
        isIntersecting: !isPast,
        boundingClientRect: { top: isPast ? -200 : 120 } as DOMRectReadOnly,
        rootBounds: { top: 0 } as DOMRectReadOnly,
      },
    ]),
  );

describe("PullRequestStickyBar", () => {
  beforeEach(() => {
    observerCallback = null;
    disconnect.mockClear();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stays hidden while the full header is in view", () => {
    render(<Harness />);

    const bar = screen.getByTestId("pr-sticky-bar");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(bar).toHaveAttribute("inert");
  });

  it("shows the compact header once the full one scrolls away", () => {
    render(<Harness />);
    scrollHeader(true);

    const bar = screen.getByTestId("pr-sticky-bar");
    expect(bar).toHaveAttribute("aria-hidden", "false");
    expect(bar).not.toHaveAttribute("inert");
    expect(bar).toHaveTextContent(
      "feat(activity): implement activity tracking #39",
    );
    expect(bar).toHaveTextContent(
      "ilham wants to merge into development from feat/activity",
    );
    expect(bar).toHaveTextContent("+467 −92");

    scrollHeader(false);
    expect(bar).toHaveAttribute("aria-hidden", "true");
  });

  it("jumps to the review section", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<Harness />);
    scrollHeader(true);

    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "start" }),
    );
  });

  it("offers Review only to reviewers on an open PR", () => {
    const { rerender } = render(<Harness role="VIEWER" />);
    scrollHeader(true);
    expect(
      screen.queryByRole("button", { name: "Review" }),
    ).not.toBeInTheDocument();

    rerender(<Harness detail={{ ...DETAIL, state: "MERGED" }} />);
    expect(
      screen.queryByRole("button", { name: "Review" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("pr-sticky-bar")).toHaveTextContent(
      "ilham merged into development from feat/activity",
    );
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(<Harness />);
    unmount();

    expect(disconnect).toHaveBeenCalled();
  });
});
