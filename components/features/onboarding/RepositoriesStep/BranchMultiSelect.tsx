"use client";

import classNames from "classnames";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import Checkbox from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon/Icon";

interface PanelRect {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
}

interface BranchMultiSelectProps {
  branches: string[];
  defaultBranch: string;
  total: number;
  truncated: boolean;
  selected: Record<string, boolean>;
  onToggle: (branch: string) => void;
  disabled?: boolean;
}

const PANEL_HEIGHT_ESTIMATE = 290;
const MAX_RENDERED_BRANCHES = 60;

const BranchMultiSelect = React.memo(
  ({
    branches,
    defaultBranch,
    total,
    truncated,
    selected,
    onToggle,
    disabled,
  }: BranchMultiSelectProps) => {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [panelRect, setPanelRect] = useState<PanelRect | null>(null);
    const [query, setQuery] = useState("");

    const computeRect = useCallback(() => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const openUpward =
        window.innerHeight - rect.bottom < PANEL_HEIGHT_ESTIMATE &&
        rect.top > PANEL_HEIGHT_ESTIMATE;
      setPanelRect({
        left: rect.left,
        width: rect.width,
        top: openUpward ? undefined : rect.bottom + 4,
        bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
      });
    }, []);

    const handleTriggerClick = useCallback(() => {
      if (disabled) return;
      if (isOpen) {
        setIsOpen(false);
        return;
      }
      computeRect();
      setQuery("");
      setIsOpen(true);
    }, [computeRect, disabled, isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const reposition = () => computeRect();
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);
      return () => {
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
      };
    }, [computeRect, isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (panelRef.current?.contains(target)) return;
        if (triggerRef.current?.contains(target)) return;
        setIsOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const otherBranches = useMemo(
      () => branches.filter((branch) => branch !== defaultBranch),
      [branches, defaultBranch],
    );

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return otherBranches;
      return otherBranches.filter((branch) => branch.toLowerCase().includes(q));
    }, [otherBranches, query]);

    const visible = filtered.slice(0, MAX_RENDERED_BRANCHES);
    // `selected` sudah menyertakan default branch (diisi oleh parent saat
    // data pertama kali datang), jadi pickedCount ini sudah termasuk default
    // — jangan ditambah lagi saat dipakai untuk label "x of total".
    const pickedCount = Object.values(selected).filter(Boolean).length;
    const extra = pickedCount - 1;

    const handleBranchRowClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const branch = (e.target as HTMLElement).closest<HTMLElement>(
          "[data-branch]",
        )?.dataset.branch;
        if (branch) onToggle(branch);
      },
      [onToggle],
    );

    const summaryLabel = `${defaultBranch}${extra > 0 ? ` · +${extra}` : ""}`;

    return (
      <div className="flex items-center gap-2.5">
        <span className="shrink-0 font-mono text-[10.5px] tracking-[.07em] text-text-muted uppercase">
          Monitor
        </span>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={handleTriggerClick}
          className="flex flex-1 items-center gap-2 rounded-md border border-border-default bg-raised px-2.5 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex-1 truncate font-mono text-[11.5px] text-success-light">
            {summaryLabel}
          </span>
          <span className="shrink-0 font-mono text-[10.5px] text-text-muted">
            {pickedCount} of {total}
          </span>
          <Icon
            icon={isOpen ? "TbChevronUp" : "TbChevronDown"}
            size={12}
            className="shrink-0 text-text-secondary"
          />
        </button>
        {isOpen &&
          panelRect &&
          createPortal(
            <div
              ref={panelRef}
              style={{
                position: "fixed",
                left: panelRect.left,
                width: panelRect.width,
                top: panelRect.top,
                bottom: panelRect.bottom,
              }}
              className="z-50 flex flex-col overflow-hidden rounded-lg border border-border-default bg-raised shadow-lg"
            >
              <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
                <Icon icon="TbSearch" size={13} className="text-text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search branches…"
                  className="flex-1 bg-transparent font-mono text-[12px] text-neutral-100 outline-none placeholder:text-text-muted"
                />
              </div>
              <div className="max-h-50 overflow-auto">
                <div className="flex items-center gap-2.5 bg-success/10 px-3 py-2">
                  <Checkbox checked readOnly disabled />
                  <span className="flex-1 truncate font-mono text-[12px] text-text-secondary">
                    {defaultBranch}
                  </span>
                  <span className="shrink-0 text-[9px] tracking-[.06em] text-text-muted">
                    DEFAULT · ALWAYS ON
                  </span>
                </div>
                {visible.length === 0 ? (
                  <p className="px-3 py-3.5 text-center text-[11.5px] text-text-muted">
                    {otherBranches.length === 0
                      ? "No other branches on this repository."
                      : "No branch matches."}
                  </p>
                ) : (
                  <div onClick={handleBranchRowClick}>
                    {visible.map((branch) => (
                      <div
                        key={branch}
                        data-branch={branch}
                        className={classNames(
                          "flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-raised-alt",
                          { "bg-primary-950": selected[branch] },
                        )}
                      >
                        <Checkbox checked={!!selected[branch]} readOnly />
                        <span className="flex-1 truncate font-mono text-[12px] text-neutral-100">
                          {branch}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {(total > MAX_RENDERED_BRANCHES || truncated) && (
                <div className="border-t border-border-subtle px-3 py-2 text-[10.5px] text-text-muted">
                  Showing {Math.min(visible.length + 1, MAX_RENDERED_BRANCHES)}{" "}
                  of {total} branches — refine your search.
                </div>
              )}
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

BranchMultiSelect.displayName = "BranchMultiSelect";

export default BranchMultiSelect;
