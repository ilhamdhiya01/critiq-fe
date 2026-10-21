"use client";

import classNames from "classnames";
import React from "react";

import Badge from "@/components/ui/badge";
import { PULL_REQUEST_STATUS_MAP } from "@/const/pull-request.constant";
import { SEARCH_GROUP_BADGE } from "@/const/search.constant";
import { getRepoName } from "@/lib/helpers/search.helper";
import type { SearchEntry, SearchEntryMeta } from "@/lib/types/search.types";

import HighlightText from "./HighlightText";

interface SearchResultRowProps {
  entry: SearchEntry;
  index: number;
  optionId: string;
  isActive: boolean;
  query: string;
  onSelect: (entry: SearchEntry) => void;
  onHover: (index: number) => void;
}

const renderMeta = (meta: SearchEntryMeta) => {
  if (meta.kind === "critical") {
    return <span className="text-danger-light">{meta.text}</span>;
  }
  if (meta.kind === "pull") {
    const status =
      PULL_REQUEST_STATUS_MAP[
        meta.state.toUpperCase() as keyof typeof PULL_REQUEST_STATUS_MAP
      ];
    return (
      <span className="flex items-center gap-1.5" title={meta.repoPath}>
        {getRepoName(meta.repoPath)}
        {meta.state !== "open" && (
          <span
            role="img"
            aria-label={status.label}
            title={status.label}
            className={classNames("h-1.5 w-1.5 rounded-full", status.dot)}
          />
        )}
      </span>
    );
  }
  return meta.text;
};

const SearchResultRow = React.memo(
  ({
    entry,
    index,
    optionId,
    isActive,
    query,
    onSelect,
    onHover,
  }: SearchResultRowProps) => {
    const badge = SEARCH_GROUP_BADGE[entry.group];

    return (
      <li
        id={optionId}
        role="option"
        aria-selected={isActive}
        // Keep focus in the input so typing and ↑/↓ still work.
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => onHover(index)}
        onClick={() => onSelect(entry)}
        className={classNames(
          "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
          { "bg-surface-hover": isActive },
        )}
      >
        <Badge tone={badge.tone} className="min-w-11 justify-center">
          {badge.label}
        </Badge>
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-text-strong">
          <HighlightText text={entry.label} query={query} />
        </span>
        {entry.meta && (
          <span className="shrink-0 font-mono text-[11.5px] text-text-muted">
            {renderMeta(entry.meta)}
          </span>
        )}
      </li>
    );
  },
);

SearchResultRow.displayName = "SearchResultRow";

export default SearchResultRow;
