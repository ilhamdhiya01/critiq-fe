"use client";

import classNames from "classnames";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import Icon from "@/components/ui/icon/Icon";
import Spinner from "@/components/ui/spinner";
import { SEARCH_DEBOUNCE_MS, SEARCH_MAX_LENGTH } from "@/const/search.constant";
import {
  buildSearchEntries,
  filterSearchPages,
  isSearchableQuery,
} from "@/lib/helpers/search.helper";
import { useOrgBySlug } from "@/lib/hooks/organisation/useOrgBySlug";
import { useGlobalSearch } from "@/lib/hooks/search/useGlobalSearch";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useDismissable } from "@/lib/hooks/useDismissable";
import type { SearchEntry } from "@/lib/types/search.types";

// Not visible until the field is focused.
const SearchDropdown = dynamic(() => import("./SearchDropdown"), {
  loading: () => null,
  ssr: false,
});

// Navbar search (⌘K / Ctrl+K): repos, PRs and rules from the BE, pages
// filtered locally.
const GlobalSearch = React.memo(() => {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { orgId } = useOrgBySlug(slug);
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const getOptionId = useCallback(
    (index: number) => `${listboxId}-option-${index}`,
    [listboxId],
  );

  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const isSearching = isSearchableQuery(debouncedQuery);
  const { data, isError, isFetching } = useGlobalSearch(orgId, debouncedQuery);

  const entries = useMemo(
    () =>
      buildSearchEntries(
        // keepPreviousData would otherwise leave old results after clearing.
        isSearching ? data : undefined,
        filterSearchPages(debouncedQuery),
        slug,
      ),
    [isSearching, data, debouncedQuery, slug],
  );
  const safeIndex = Math.min(activeIndex, Math.max(entries.length - 1, 0));

  const close = useCallback(() => {
    setIsOpen(false);
    inputRef.current?.blur();
  }, []);
  useDismissable(isOpen, close, [wrapperRef]);

  // ⌘K / Ctrl+K from anywhere.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (entry: SearchEntry) => {
      router.push(entry.href);
      setQuery("");
      setActiveIndex(0);
      close();
    },
    [router, close],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      if (entries.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((safeIndex + step + entries.length) % entries.length);
    } else if (event.key === "Enter" && isOpen && entries[safeIndex]) {
      event.preventDefault();
      handleSelect(entries[safeIndex]);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={classNames(
          "flex max-w-[60vw] items-center gap-2 rounded-[7px] border bg-raised px-3 py-1.5 transition-[width] duration-150 motion-reduce:transition-none",
          {
            "w-70 border-border-default": !isOpen,
            "w-120 border-neutral-600": isOpen,
          },
        )}
      >
        {isFetching && isSearching ? (
          <Spinner size={14} className="shrink-0 text-text-muted" />
        ) : (
          <Icon
            icon="TbSearch"
            size={14}
            className="shrink-0 stroke-[1.8] text-text-muted"
          />
        )}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && entries.length > 0 ? getOptionId(safeIndex) : undefined
          }
          value={query}
          maxLength={SEARCH_MAX_LENGTH}
          placeholder="Search repos, PRs, rules…"
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-text-strong outline-none placeholder:text-text-placeholder"
        />
        <kbd className="shrink-0 rounded border border-border-default px-1.5 font-mono text-[10px] text-text-placeholder">
          ⌘K
        </kbd>
      </div>

      {isOpen && (
        <SearchDropdown
          listboxId={listboxId}
          getOptionId={getOptionId}
          entries={entries}
          activeIndex={safeIndex}
          query={debouncedQuery}
          isUnavailable={isSearching && isError}
          isSearching={isFetching}
          onSelect={handleSelect}
          onHover={setActiveIndex}
        />
      )}
    </div>
  );
});

GlobalSearch.displayName = "GlobalSearch";

export default GlobalSearch;
