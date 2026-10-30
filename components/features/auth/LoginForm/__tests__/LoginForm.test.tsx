import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import LoginForm from "../LoginForm";

describe("LoginForm", () => {
  it("explains an expired OAuth state so the user simply tries again", () => {
    render(<LoginForm error="oauth_state" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sesi login kedaluwarsa, coba lagi",
    );
  });

  it("shows nothing for an unknown or missing error code", () => {
    const { rerender } = render(<LoginForm error="constructor" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<LoginForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
