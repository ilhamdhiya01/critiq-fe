import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import DropdownMenu, { type DropdownMenuItem } from "../DropdownMenu";

const renderMenu = (items: DropdownMenuItem[]) =>
  render(
    <div>
      <p>Outside</p>
      <DropdownMenu
        ariaLabel="Member actions"
        items={items}
        trigger={({ isOpen, toggle }) => (
          <button type="button" aria-expanded={isOpen} onClick={toggle}>
            Actions
          </button>
        )}
      />
    </div>,
  );

const trigger = () => screen.getByRole("button", { name: "Actions" });
const menu = () => screen.queryByRole("menu", { name: "Member actions" });

const ITEMS = (onSelect = vi.fn()): DropdownMenuItem[] => [
  {
    key: "admin",
    label: "Admin",
    description: "Full access",
    checked: true,
    onSelect,
  },
  { key: "member", label: "Member", onSelect },
  { key: "remove", label: "Remove", tone: "danger", onSelect },
];

describe("DropdownMenu", () => {
  it("toggles the menu from the trigger", () => {
    renderMenu(ITEMS());

    expect(menu()).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger());
    expect(menu()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(within(menu()!).getAllByRole("menuitem")).toHaveLength(3);

    fireEvent.click(trigger());
    expect(menu()).not.toBeInTheDocument();
  });

  it("closes after a choice and runs it", () => {
    const onSelect = vi.fn();
    renderMenu(ITEMS(onSelect));

    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("menuitem", { name: "Member" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(menu()).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    renderMenu(ITEMS());

    fireEvent.click(trigger());
    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(menu()).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(menu()).not.toBeInTheDocument();
  });

  it("closes on an outside click but not on a click inside", () => {
    renderMenu(ITEMS());

    fireEvent.click(trigger());
    fireEvent.mouseDown(screen.getByRole("menuitem", { name: /Admin/ }));
    expect(menu()).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText("Outside"));
    expect(menu()).not.toBeInTheDocument();
  });
});
