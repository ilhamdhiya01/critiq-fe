"use client";

import React, { useState } from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon/Icon";
import Textarea from "@/components/ui/textarea";
import type { PullRequestComment } from "@/lib/types/pull-request.types";

import CommentItem from "../CommentItem";

const PullRequestDiscussion = React.memo(() => {
  const [comments, setComments] = useState<PullRequestComment[]>([]);
  const [draft, setDraft] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setComments((current) => [
      ...current,
      {
        id: `${Date.now()}`,
        author: "Kamu",
        body,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface">
      <div className="border-b border-border-subtle px-5 py-3.5">
        <span className="font-mono text-[13px] font-semibold text-text-strong">
          Diskusi <span className="text-text-faint">({comments.length})</span>
        </span>
      </div>

      {comments.length === 0 ? (
        <div className="border-b border-border-row px-5 py-4 text-xs text-text-muted">
          Belum ada komentar.
        </div>
      ) : (
        comments.map((comment) => (
          <div
            key={comment.id}
            className="border-b border-border-row px-5 py-3.5"
          >
            <CommentItem comment={comment} />
          </div>
        ))
      )}

      <form onSubmit={handleSubmit} className="flex gap-3 px-5 py-3.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-raised text-text-secondary">
          <Icon icon="TbUser" size={14} />
        </span>
        <div className="flex flex-1 flex-col items-start gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tulis catatan review…"
            rows={3}
          />
          <Button
            type="submit"
            size="sm"
            fullWidth={false}
            disabled={!draft.trim()}
          >
            Komentar
          </Button>
        </div>
      </form>
    </div>
  );
});

PullRequestDiscussion.displayName = "PullRequestDiscussion";

export default PullRequestDiscussion;
