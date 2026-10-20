"use client";

import React, { useEffect } from "react";

import { SEARCH_GROUP_LABEL } from "@/const/search.constant";
import type { SearchEntry } from "@/lib/types/search.types";

import SearchResultRow from "./SearchResultRow";

interface SearchDropdownProps {
  listboxId: string;
  getOptionId: (index: number) => string;
  entries: SearchEntry[];
  activeIndex: number;
  // The (debounced) query the entries belong to.
  query: string;
  isUnavailable: boolean;
  isSearching: boolean;
  onSelect: (entry: SearchEntry) => void;
  onHover: (index: number) => void;
}

const MESSAGE = "px-3 py-2 text-[12px] text-text-muted";

const SearchDropdown = React.memo(
  ({
    listboxId,
    getOptionId,
    entries,
    activeIndex,
    query,
    isUnavailable,
    isSearching,
    onSelect,
    onHover,
  }: SearchDropdownProps) => {
    // Keep the keyboard selection in view.
    useEffect(() => {
      document
        .getElementById(getOptionId(activeIndex))
        ?.scrollIntoView?.({ block: "nearest" });
    }, [activeIndex, getOptionId]);

    const q = query.trim();

    return (
      <div className="absolute top-full right-0 z-50 mt-2 flex w-full flex-col overflow-hidden rounded-lg border border-border-default bg-raised-alt shadow-lg">
        <div className="max-h-[min(70vh,560px)] overflow-y-auto p-2">
          {isUnavailable && <p className={MESSAGE}>Search unavailable</p>}
          {entries.length === 0 && q && (
            <p className={MESSAGE}>
              {isSearching ? "Searching…" : `No results for "${q}"`}
            </p>
          )}
          <ul id={listboxId} role="listbox" aria-label="Search results">
            {entries.map((entry, index) => (
              <React.Fragment key={entry.key}>
                {entry.group !== entries[index - 1]?.group && (
                  <li
                    role="presentation"
                    className="px-3 pt-3 pb-1.5 font-mono text-[10.5px] tracking-[.12em] text-text-muted uppercase first:pt-1.5"
                  >
                    {SEARCH_GROUP_LABEL[entry.group]}
                  </li>
                )}
                <SearchResultRow
                  entry={entry}
                  index={index}
                  optionId={getOptionId(index)}
                  isActive={index === activeIndex}
                  query={q}
                  onSelect={onSelect}
                  onHover={onHover}
                />
              </React.Fragment>
            ))}
          </ul>
        </div>
        <div className="flex gap-4 border-t border-border-default px-4 py-2.5 font-mono text-[10.5px] tracking-[.08em] text-text-muted uppercase">
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    );
  },
);

SearchDropdown.displayName = "SearchDropdown";

export default SearchDropdown;
