import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import Notice from "../Notice";

describe("Notice", () => {
  it("announces warnings and errors", () => {
    render(<Notice tone="danger">Save failed.</Notice>);

    expect(screen.getByRole("alert")).toHaveTextContent("Save failed.");
  });

  it("uses a polite status role for a note", () => {
    render(<Notice tone="note">Heads up.</Notice>);

    expect(screen.getByRole("status")).toHaveTextContent("Heads up.");
  });

  it("keeps the text neutral and marks warnings with a left bar", () => {
    const { rerender } = render(<Notice tone="warning">Pending.</Notice>);
    expect(screen.getByRole("alert")).toHaveClass(
      "bg-raised",
      "border-l-2",
      "border-l-warning",
    );
    expect(screen.getByText("Pending.")).toHaveClass("text-text-nav");

    rerender(<Notice tone="note">Heads up.</Notice>);
    expect(screen.getByRole("status")).not.toHaveClass("border-l-2");
  });

  it("renders the in-card row variant", () => {
    render(
      <Notice tone="danger" variant="row">
        Row error
      </Notice>,
    );

    expect(screen.getByRole("alert")).toHaveClass("border-b", "px-5");
  });
});
