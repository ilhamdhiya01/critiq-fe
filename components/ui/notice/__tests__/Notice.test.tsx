import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import Notice from "../Notice";

describe("Notice", () => {
  it("announces warnings and errors", () => {
    render(<Notice tone="danger">Save failed.</Notice>);

    expect(screen.getByRole("alert")).toHaveTextContent("Save failed.");
  });

  it("uses a polite status role for info", () => {
    render(<Notice tone="info">Heads up.</Notice>);

    expect(screen.getByRole("status")).toHaveTextContent("Heads up.");
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
