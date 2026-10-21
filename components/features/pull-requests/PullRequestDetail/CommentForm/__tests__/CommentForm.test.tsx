import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { COMMENT_BODY_MAX } from "@/const/pull-request.constant";

import CommentForm from "../CommentForm";

const PLACEHOLDER = "Tulis komentar…";

const renderForm = (
  props: Partial<React.ComponentProps<typeof CommentForm>> = {},
) => {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  render(
    <CommentForm
      placeholder={PLACEHOLDER}
      submitLabel="Komentar"
      isSubmitting={false}
      error={null}
      {...props}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit };
};

const textbox = () => screen.getByRole("textbox", { name: PLACEHOLDER });
const submitButton = () => screen.getByRole("button", { name: "Komentar" });
const type = (value: string) =>
  fireEvent.change(textbox(), { target: { value } });

describe("CommentForm", () => {
  it("blocks an empty or whitespace-only comment", () => {
    renderForm();

    expect(submitButton()).toBeDisabled();
    type("   \n ");
    expect(submitButton()).toBeDisabled();
  });

  it("allows exactly the limit and blocks one character over it", () => {
    const { onSubmit } = renderForm();

    type("a".repeat(COMMENT_BODY_MAX));
    expect(submitButton()).toBeEnabled();

    type("a".repeat(COMMENT_BODY_MAX + 1));
    expect(submitButton()).toBeDisabled();
    fireEvent.submit(textbox().closest("form") as HTMLFormElement);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the trimmed body and clears the draft once saved", async () => {
    const { onSubmit } = renderForm();

    type("  Please rename this  ");
    fireEvent.click(submitButton());

    await waitFor(() => expect(textbox()).toHaveValue(""));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("Please rename this");
  });

  it("keeps the draft when saving fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("boom"));
    renderForm({ onSubmit });

    type("Keep me");
    fireEvent.click(submitButton());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Keep me"));
    expect(textbox()).toHaveValue("Keep me");
  });

  it("disables submit and cancel while submitting", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderForm({ onSubmit, onCancel, isSubmitting: true });

    type("In flight");

    expect(submitButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Batal" })).toBeDisabled();
    fireEvent.submit(textbox().closest("form") as HTMLFormElement);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("cancels through onCancel and has no cancel button without it", () => {
    const onCancel = vi.fn();
    const { unmount } = render(
      <CommentForm
        onSubmit={vi.fn()}
        placeholder={PLACEHOLDER}
        submitLabel="Balas"
        isSubmitting={false}
        error={null}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    unmount();
    renderForm();
    expect(
      screen.queryByRole("button", { name: "Batal" }),
    ).not.toBeInTheDocument();
  });
});
