import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EmptyState from "../EmptyState";

describe("EmptyState", () => {
  it("shows an icon, a heading and the description", () => {
    const { container } = render(
      <EmptyState
        icon="TbFolder"
        title="No repositories connected yet"
        description="They show up here."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No repositories connected yet" }),
    ).toBeInTheDocument();
    expect(screen.getByText("They show up here.")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden");
  });

  it("renders actions only when given", () => {
    const { rerender } = render(
      <EmptyState icon="TbFilterOff" title="No matches" />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <EmptyState
        icon="TbFilterOff"
        title="No matches"
        action={<button type="button">Show all</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Show all" }),
    ).toBeInTheDocument();
  });

  it("brings its own card only at page size", () => {
    const { container, rerender } = render(
      <EmptyState icon="TbClock" title="No reviews yet" size="page" />,
    );
    expect(container.firstChild).toHaveClass("border", "bg-surface");

    rerender(<EmptyState icon="TbClock" title="No reviews yet" />);
    expect(container.firstChild).not.toHaveClass("border");
  });
});
