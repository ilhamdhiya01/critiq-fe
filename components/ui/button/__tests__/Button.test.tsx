import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import Button from "../Button";

// Guards against double submits: every form submit/delete goes through this.
describe("Button", () => {
  it("blocks clicks while loading and shows a spinner instead of the icon", () => {
    const onClick = vi.fn();
    render(
      <Button isLoading icon={<span data-testid="icon" />} onClick={onClick}>
        Connect
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Connect" });

    expect(button).toBeDisabled();
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is natively disabled so it cannot be triggered", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick when enabled", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("navigates via an anchor when given a link, and flags it when disabled", () => {
    const { rerender } = render(
      <Button link="/acme/settings">Settings</Button>,
    );
    const link = screen.getByRole("link", { name: "Settings" });

    expect(link).toHaveAttribute("href", "/acme/settings");
    expect(link).not.toHaveAttribute("aria-disabled");

    rerender(
      <Button link="/acme/settings" disabled>
        Settings
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
