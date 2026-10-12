"use client";

import classNames from "classnames";
import React, { useState } from "react";

import Button from "@/components/ui/button";
import FieldError from "@/components/ui/field-error";
import Textarea from "@/components/ui/textarea";
import { COMMENT_BODY_MAX } from "@/const/pull-request.constant";

interface CommentFormProps {
  // Resolves when saved; the draft is cleared only then.
  onSubmit: (body: string) => Promise<unknown>;
  placeholder: string;
  submitLabel: string;
  isSubmitting: boolean;
  error: string | null;
  onCancel?: () => void;
  autoFocus?: boolean;
  rows?: number;
}

const CommentForm = React.memo(
  ({
    onSubmit,
    placeholder,
    submitLabel,
    isSubmitting,
    error,
    onCancel,
    autoFocus = false,
    rows = 3,
  }: CommentFormProps) => {
    const [draft, setDraft] = useState("");
    const trimmed = draft.trim();
    const isTooLong = draft.length > COMMENT_BODY_MAX;
    const canSubmit = trimmed !== "" && !isTooLong && !isSubmitting;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSubmit) return;
      try {
        await onSubmit(trimmed);
        setDraft("");
      } catch {
        // `error` explains it; the draft is kept.
      }
    };

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          rows={rows}
          autoFocus={autoFocus}
          error={isTooLong ? "too long" : undefined}
          className="text-[12.5px]"
        />
        {error && <FieldError>{error}</FieldError>}
        <div className="flex items-center justify-end gap-2.5">
          <span
            className={classNames("mr-auto font-mono text-[10.5px]", {
              "text-danger-light": isTooLong,
              "text-text-muted": !isTooLong,
            })}
          >
            {draft.length}/{COMMENT_BODY_MAX}
          </span>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Batal
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            fullWidth={false}
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    );
  },
);

CommentForm.displayName = "CommentForm";

export default CommentForm;
