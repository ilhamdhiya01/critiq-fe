"use client";

import Image from "next/image";
import React, { useState } from "react";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useUser } from "@/lib/hooks/auth/useUser";
import type { PullRequestComment } from "@/lib/types/pull-request.types";

import CommentItem from "../CommentItem";

interface DiffCommentThreadProps {
  path: string;
  lineNumber: number;
  comments: PullRequestComment[];
  onSubmit: (body: string) => void;
}

const DiffCommentThread = React.memo(
  ({ path, lineNumber, comments, onSubmit }: DiffCommentThreadProps) => {
    const [draft, setDraft] = useState("");
    const { data: user } = useUser();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const body = draft.trim();
      if (!body) return;
      onSubmit(body);
      setDraft("");
    };

    return (
      <div className="flex flex-col gap-2.5 border-y border-border-subtle bg-sunken py-3 pr-5 pl-23">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} size="sm" />
        ))}
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          {user && user.avatarUrl && (
            <Image
              alt="avatar"
              src={user.avatarUrl}
              width={25}
              height={25}
              className="rounded-full"
            />
          )}
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Komentari ${path}:${lineNumber}…`}
            className="py-1.5 font-mono text-xs"
          />
          <Button
            type="submit"
            size="sm"
            fullWidth={false}
            disabled={!draft.trim()}
          >
            Balas
          </Button>
        </form>
      </div>
    );
  },
);

DiffCommentThread.displayName = "DiffCommentThread";

export default DiffCommentThread;
