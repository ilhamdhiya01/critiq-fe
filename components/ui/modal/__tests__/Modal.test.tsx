import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import Modal from "../Modal";

describe("Modal", () => {
  it("renders nothing while closed and ignores Escape", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={false} title="Invite" onClose={onClose}>
        Body
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders a named modal dialog into document.body", () => {
    const { container } = render(
      <Modal isOpen title="Invite" onClose={vi.fn()}>
        Body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Invite" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("Body");
    // Portalled out of the render container.
    expect(container).not.toContainElement(dialog);
    expect(document.body).toContainElement(dialog);
  });

  it("closes from the X button", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Invite" onClose={onClose}>
        Body
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape but not on other keys", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Invite" onClose={onClose}>
        Body
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stops listening for Escape once closed or unmounted", () => {
    const onClose = vi.fn();
    const { rerender, unmount } = render(
      <Modal isOpen title="Invite" onClose={onClose}>
        Body
      </Modal>,
    );

    rerender(
      <Modal isOpen={false} title="Invite" onClose={onClose}>
        Body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <Modal isOpen title="Invite" onClose={onClose}>
        Body
      </Modal>,
    );
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders the footer only when given one", () => {
    const { rerender } = render(
      <Modal isOpen title="Invite" onClose={vi.fn()}>
        Body
      </Modal>,
    );

    expect(
      screen.queryByRole("button", { name: "Send" }),
    ).not.toBeInTheDocument();

    rerender(
      <Modal
        isOpen
        title="Invite"
        onClose={vi.fn()}
        footer={<button type="button">Send</button>}
      >
        Body
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });
});
