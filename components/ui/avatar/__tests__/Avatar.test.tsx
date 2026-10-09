import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import Avatar from "../Avatar";

describe("Avatar", () => {
  it("shows initials of a username", () => {
    render(<Avatar name="ilhamdhiya01" />);

    expect(screen.getByTitle("ilhamdhiya01")).toHaveTextContent("IL");
  });

  it("uses the first letters of a multi-word name", () => {
    render(<Avatar name="Ilham Dhiya Ulhaq" size="lg" />);

    expect(screen.getByTitle("Ilham Dhiya Ulhaq")).toHaveTextContent("ID");
  });

  it("lets callers override the derived colour", () => {
    render(<Avatar name="Rina" colorClass="bg-info/25 text-info-light" />);

    expect(screen.getByTitle("Rina")).toHaveClass("bg-info/25");
  });
});
