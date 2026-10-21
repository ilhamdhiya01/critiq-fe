import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { MERGE_OVERRIDE_REASON_MAX } from "@/const/pull-request.constant";

import MergeDialog from "../MergeDialog";

const renderDialog = (
  props: Partial<React.ComponentProps<typeof MergeDialog>> = {},
) => {
  const onMerge = props.onMerge ?? vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <MergeDialog
      pullLabel="#42"
      targetBranch="main"
      sourceBranch="feat/rate-limit"
      providerName="GitHub"
      headSha="sha_head"
      isOverride={false}
      criticalCount={0}
      isMerging={false}
      error={null}
      onClose={onClose}
      {...props}
      onMerge={onMerge}
    />,
  );
  return { onMerge, onClose };
};

const button = (name: string) => screen.getByRole("button", { name });
const reasonBox = () =>
  // The label also wraps the character counter.
  screen.getByRole("textbox", {
    name: /^Why merge with open critical findings\?/,
  });

describe("MergeDialog", () => {
  it("merges with a merge commit by default, then closes", async () => {
    const { onMerge, onClose } = renderDialog();

    fireEvent.click(button("Merge"));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onMerge).toHaveBeenCalledWith({
      headSha: "sha_head",
      method: "merge",
      deleteSourceBranch: false,
    });
  });

  it("sends the chosen method and branch deletion", async () => {
    const { onMerge } = renderDialog();

    fireEvent.click(screen.getByRole("radio", { name: "Squash" }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Delete source branch/ }),
    );
    fireEvent.click(button("Merge"));

    await waitFor(() =>
      expect(onMerge).toHaveBeenCalledWith({
        headSha: "sha_head",
        method: "squash",
        deleteSourceBranch: true,
      }),
    );
  });

  it("stays open with the error when merging fails", async () => {
    const onMerge = vi.fn().mockRejectedValue(new Error("not_mergeable"));
    const { onClose } = renderDialog({
      onMerge,
      error: "GitHub says the branch has conflicts.",
    });

    fireEvent.click(button("Merge"));

    await waitFor(() => expect(onMerge).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "GitHub says the branch has conflicts.",
    );
  });

  it("disables both actions while merging", () => {
    const { onMerge } = renderDialog({ isMerging: true });

    expect(button("Cancel")).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Merge/ })).toBeDisabled();
    expect(onMerge).not.toHaveBeenCalled();
  });

  it("cancels without merging", () => {
    const { onMerge, onClose } = renderDialog();

    fireEvent.click(button("Cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onMerge).not.toHaveBeenCalled();
  });

  describe("override over critical findings", () => {
    it("warns and requires a non-blank reason", () => {
      renderDialog({ isOverride: true, criticalCount: 3 });

      expect(screen.getByRole("dialog")).toHaveTextContent(
        "3 critical findings are still open.",
      );
      expect(button("Merge anyway")).toBeDisabled();

      fireEvent.change(reasonBox(), { target: { value: "   " } });
      expect(button("Merge anyway")).toBeDisabled();
    });

    it("blocks a reason over the limit", () => {
      renderDialog({ isOverride: true, criticalCount: 1 });

      fireEvent.change(reasonBox(), {
        target: { value: "a".repeat(MERGE_OVERRIDE_REASON_MAX + 1) },
      });

      expect(button("Merge anyway")).toBeDisabled();
    });

    it("sends the trimmed reason with the merge", async () => {
      const { onMerge } = renderDialog({ isOverride: true, criticalCount: 1 });

      fireEvent.change(reasonBox(), {
        target: { value: "  False positive — test fixture  " },
      });
      fireEvent.click(button("Merge anyway"));

      await waitFor(() =>
        expect(onMerge).toHaveBeenCalledWith({
          headSha: "sha_head",
          method: "merge",
          deleteSourceBranch: false,
          overrideCritical: { reason: "False positive — test fixture" },
        }),
      );
    });
  });
});
